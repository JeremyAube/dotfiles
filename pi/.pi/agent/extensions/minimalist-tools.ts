/**
 * Affichage minimaliste des outils intégrés (style OpenCode).
 *
 * Chaque outil s'affiche sur une seule ligne, en gris (muted), avec 4 espaces
 * de padding à gauche, un spinner animé pendant l'exécution, et un fond
 * coloré (vert = succès, rouge = erreur, ambre = en cours) :
 *
 *     ⠹ 📝 READ => ./path/to/file.ts
 *     ⠙ ⚙️  BASH => npm run build
 *     ⠹ ✏️  EDIT => ./path/to/file.ts (2 changes)
 *     ⠙ 📄 WRITE => ./path/to/file.ts
 *     ⠹ 🔍 GREP => "pattern" in ./src
 *     ⠙ 📁 FIND => "**\/*.ts" in ./src
 *     ⠹ 📃 LS => ./src
 *
 * La vue dépliée (Ctrl+o) délègue au rendu intégré de chaque outil
 * (coloration syntaxique, diffs, sortie complète, etc.).
 *
 * L'exécution réelle est déléguée aux fabriques `create*ToolDefinition` de pi,
 * afin de conserver un comportement identique (troncature, images, `details`).
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
	createBashToolDefinition,
	createEditToolDefinition,
	createFindToolDefinition,
	createGrepToolDefinition,
	createLsToolDefinition,
	createReadToolDefinition,
	createWriteToolDefinition,
} from "@earendil-works/pi-coding-agent";
import { Container, Text, truncateToWidth } from "@earendil-works/pi-tui";
import { basename } from "node:path";
import { Type } from "typebox";

const PADDING = "    ";
const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const SPINNER_INTERVAL_MS = 80;

type ThemeLike = {
	fg: (color: string, text: string) => string;
	bg: (color: string, text: string) => string;
	bold: (text: string) => string;
};

/** État partagé entre `renderCall` et `renderResult` pour un même appel (spinner). */
interface SpinnerState {
	frameIndex: number;
	intervalId: ReturnType<typeof setInterval> | null;
	done: boolean;
}

/** Couleur de fond selon l'état d'exécution. */
function bgFor(context: { isPartial: boolean; isError: boolean }): string {
	if (context.isError) return "toolErrorBg";
	if (context.isPartial) return "toolPendingBg";
	return "toolSuccessBg";
}

/** Affiche un chemin : relatif avec `./` sous le cwd, sinon juste le nom de fichier. */
function shortenForDisplay(path: string, cwd: string): string {
	if (!path) return "";
	if (path.startsWith(cwd + "/")) return "./" + path.slice(cwd.length + 1);
	return basename(path) || path;
}

/** Construit une ligne minimaliste : `    <ICÔNE> <LABEL> => <détail>` en muted. */
function formatLine(
	icon: string,
	label: string,
	detail: string,
	theme: ThemeLike,
	width: number,
	isError = false,
): string {
	const arrow = " => ";
	const line =
		PADDING +
		theme.fg("muted", icon + " " + theme.bold(label) + arrow + detail) +
		(isError ? " " + theme.fg("error", "✗") : "");
	return truncateToWidth(line, width, "");
}

/** Largeur de rendu (le terminal courant). */
function renderWidth(): number {
	return Math.max(20, process.stdout.columns ?? 80);
}

/** Renvoie un composant vide pour le slot résultat (évite le doublon de ligne). */
function emptyResult(): Container {
	return new Container();
}

/** Extrait la sortie texte brute d'un résultat d'outil. */
function getResultText(result): string {
	if (!result?.content) return "";
	return result.content
		.filter((c) => c.type === "text")
		.map((c) => (c.text ?? "").replace(/\r/g, ""))
		.join("\n")
		.trim();
}

/**
 * Affiche la sortie d'erreur sous la ligne d'en-tête, avec le fond rouge.
 * Utilisé pour tout outil en erreur (vue repliée).
 */
function errorOutputResult(result, theme: ThemeLike, _context): Container {
	const container = new Container();
	const output = getResultText(result);
	if (!output) return container;
	for (const line of output.split("\n")) {
		const t = new Text(PADDING + theme.fg("toolOutput", line), 0, 0);
		t.setCustomBgFn((s) => theme.bg("toolErrorBg", s));
		container.addChild(t);
	}
	return container;
}

/** Récupère ou crée l'état spinner partagé pour cet appel d'outil. */
function ensureSpinnerState(context): SpinnerState {
	if (!context.state || typeof context.state !== "object") {
		context.state = { frameIndex: 0, intervalId: null, done: false };
	}
	const state = context.state as SpinnerState;
	if (state.frameIndex === undefined) state.frameIndex = 0;
	if (state.intervalId === undefined) state.intervalId = null;
	if (state.done === undefined) state.done = false;
	return state;
}

function startSpinner(state: SpinnerState, invalidate: () => void): void {
	if (state.intervalId !== null) return;
	state.intervalId = setInterval(() => {
		state.frameIndex = (state.frameIndex + 1) % SPINNER_FRAMES.length;
		invalidate();
	}, SPINNER_INTERVAL_MS);
}

function stopSpinner(state: SpinnerState): void {
	if (state.intervalId !== null) {
		clearInterval(state.intervalId);
		state.intervalId = null;
	}
}

/** Indique si un résultat final est déjà arrivé pour cet appel. */
function hasResult(context): boolean {
	return context.state?.done === true;
}

/** Enveloppe une définition d'outil intégrée avec un rendu minimaliste. */
function withMinimalistRender(builtIn, icon: string, label: string, detailFn) {
	return {
		name: builtIn.name,
		label: builtIn.label,
		description: builtIn.description,
		promptSnippet: builtIn.promptSnippet,
		promptGuidelines: builtIn.promptGuidelines,
		parameters: builtIn.parameters ?? Type.Object({}),
		prepareArguments: builtIn.prepareArguments,
		executionMode: builtIn.executionMode,
		renderShell: "self" as const,
		async execute(toolCallId, params, signal, onUpdate, ctx) {
			return builtIn.execute(toolCallId, params, signal, onUpdate, ctx);
		},
		renderCall(args, theme: ThemeLike, context) {
			const text = (context.lastComponent as Text | undefined) ?? new Text("", 0, 0);
			const detail = detailFn(args, context.cwd);

			// Spinner tant que l'outil n'a pas de résultat final.
			// On se base sur `isPartial` (true pendant l'exécution, false une
			// fois le résultat final disponible) et `executionStarted`. Le slot
			// `renderResult` marque `state.done = true` et arrête le minuteur.
			const state = ensureSpinnerState(context);
			const pending = !state.done && (context.isPartial || !context.executionStarted);
			if (pending) {
				startSpinner(state, context.invalidate);
			} else {
				stopSpinner(state);
			}
			const prefix = pending
				? theme.fg("accent", SPINNER_FRAMES[state.frameIndex]!) + " "
				: "";

			text.setText(prefix + formatLine(icon, label, detail, theme, renderWidth(), context.isError));
			// Fond coloré sur la ligne d'en-tête (vert/rouge/ambre).
			text.setCustomBgFn((s) => theme.bg(bgFor(context), s));
			return text;
		},
		renderResult(result, options, theme: ThemeLike, context) {
			// Marque le résultat comme arrivé et arrête le spinner.
			const state = ensureSpinnerState(context);
			const wasPending = !state.done;
			state.done = true;
			stopSpinner(state);
			// Si le spinner tournait encore, on force un nouveau rendu du slot
			// `renderCall` pour qu'il recalcule la ligne sans le préfixe spinner.
			if (wasPending) context.invalidate();

			// Vue dépliée (Ctrl+o) : on délègue au rendu intégré pour bénéficier
			// de la coloration syntaxique, des diffs, de la sortie complète, etc.
			if (options.expanded) {
				if (typeof builtIn.renderResult === "function") {
					return builtIn.renderResult(result, options, theme, context);
				}
				return emptyResult();
			}
			// Vue repliée : en cas d'erreur, on affiche la sortie d'erreur sous
			// la ligne d'en-tête (fond rouge). Sinon, aucune ligne supplémentaire.
			if (context.isError) {
				return errorOutputResult(result, theme, context);
			}
			return emptyResult();
		},
	};
}

/** Détail affiché pour chaque outil, à partir des arguments d'appel. */
function readDetail(args, cwd: string): string {
	return shortenForDisplay(args?.path ?? "", cwd);
}

function bashDetail(args, _cwd: string): string {
	// Pas de troncature : on affiche la commande complète.
	return (args?.command ?? "").trim();
}

function editDetail(args, cwd: string): string {
	const path = shortenForDisplay(args?.path ?? "", cwd);
	const count = Array.isArray(args?.edits) ? args.edits.length : 0;
	return count > 0 ? `${path} (${count} change${count > 1 ? "s" : ""})` : path;
}

function writeDetail(args, cwd: string): string {
	return shortenForDisplay(args?.path ?? "", cwd);
}

function grepDetail(args, cwd: string): string {
	const pattern = args?.pattern ?? "";
	const path = args?.path ? shortenForDisplay(args.path, cwd) : ".";
	const literal = args?.literal ? `"${pattern}"` : `/${pattern}/`;
	const ignoreCase = args?.ignoreCase ? " -i" : "";
	return `${literal} in ${path}${ignoreCase}`;
}

function findDetail(args, cwd: string): string {
	const pattern = args?.pattern ?? "";
	const path = args?.path ? shortenForDisplay(args.path, cwd) : ".";
	return `"${pattern}" in ${path}`;
}

function lsDetail(args, cwd: string): string {
	return shortenForDisplay(args?.path ?? ".", cwd);
}

export default function (pi: ExtensionAPI) {
	const cwd = process.cwd();

	pi.registerTool(withMinimalistRender(createReadToolDefinition(cwd), "📝", "READ", readDetail));
	pi.registerTool(withMinimalistRender(createBashToolDefinition(cwd), "⚙️", "BASH", bashDetail));
	pi.registerTool(withMinimalistRender(createEditToolDefinition(cwd), "✏️", "EDIT", editDetail));
	pi.registerTool(withMinimalistRender(createWriteToolDefinition(cwd), "📄", "WRITE", writeDetail));
	pi.registerTool(withMinimalistRender(createGrepToolDefinition(cwd), "🔍", "GREP", grepDetail));
	pi.registerTool(withMinimalistRender(createFindToolDefinition(cwd), "📁", "FIND", findDetail));
	pi.registerTool(withMinimalistRender(createLsToolDefinition(cwd), "📃", "LS", lsDetail));
}
