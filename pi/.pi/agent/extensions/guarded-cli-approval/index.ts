import { basename } from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { GUARDED_CLI_FAMILIES, type GuardedCliFamily } from "./config";

const SHELL_COMMANDS = new Set(["sh", "bash", "zsh", "fish", "dash", "ksh"]);
const WRAPPER_COMMANDS = new Set(["sudo", "env", "command", "builtin", "nohup", "nice", "time"]);

interface GuardMatch {
	family: GuardedCliFamily;
	executable: string;
}

function splitCommandSegments(command: string): string[] {
	const segments: string[] = [];
	let current = "";
	let quote: "single" | "double" | "backtick" | null = null;
	let escaped = false;

	const pushCurrent = () => {
		const trimmed = current.trim();
		if (trimmed) segments.push(trimmed);
		current = "";
	};

	for (let i = 0; i < command.length; i++) {
		const char = command[i];

		if (escaped) {
			current += char;
			escaped = false;
			continue;
		}

		if (char === "\\" && quote !== "single") {
			current += char;
			escaped = true;
			continue;
		}

		if (quote) {
			current += char;
			if (
				(quote === "single" && char === "'") ||
				(quote === "double" && char === '"') ||
				(quote === "backtick" && char === "`")
			) {
				quote = null;
			}
			continue;
		}

		if (char === "'" || char === '"' || char === "`") {
			quote = char === "'" ? "single" : char === '"' ? "double" : "backtick";
			current += char;
			continue;
		}

		const next = command[i + 1];
		const isSeparator =
			char === ";" ||
			char === "\n" ||
			char === "|" ||
			char === "&" ||
			(char === "|" && next === "|") ||
			(char === "&" && next === "&");

		if (isSeparator) {
			pushCurrent();
			if ((char === "|" && next === "|") || (char === "&" && next === "&")) i++;
			continue;
		}

		current += char;
	}

	pushCurrent();
	return segments;
}

function tokenizeShellWords(segment: string): string[] {
	const tokens: string[] = [];
	let current = "";
	let quote: "single" | "double" | "backtick" | null = null;
	let escaped = false;

	const pushCurrent = () => {
		if (current.length > 0) tokens.push(current);
		current = "";
	};

	for (let i = 0; i < segment.length; i++) {
		const char = segment[i];

		if (escaped) {
			current += char;
			escaped = false;
			continue;
		}

		if (char === "\\" && quote !== "single") {
			escaped = true;
			continue;
		}

		if (quote) {
			if (
				(quote === "single" && char === "'") ||
				(quote === "double" && char === '"') ||
				(quote === "backtick" && char === "`")
			) {
				quote = null;
				continue;
			}
			current += char;
			continue;
		}

		if (char === "'" || char === '"' || char === "`") {
			quote = char === "'" ? "single" : char === '"' ? "double" : "backtick";
			continue;
		}

		if (/\s/.test(char)) {
			pushCurrent();
			continue;
		}

		current += char;
	}

	pushCurrent();
	return tokens;
}

function isEnvAssignment(token: string): boolean {
	return /^[A-Za-z_][A-Za-z0-9_]*=.*/.test(token);
}

function normalizeExecutableName(token: string): string | null {
	const trimmed = token.trim().replace(/^[([{]+/, "").replace(/[)\]}.,]+$/, "");
	if (!trimmed || trimmed === "--") return null;
	if (trimmed.startsWith("-")) return null;
	if (isEnvAssignment(trimmed)) return null;

	const name = basename(trimmed).replace(/\.(cmd|bat|exe)$/i, "").toLowerCase();
	return name || null;
}

function findShellInlineCommand(tokens: string[], commandIndex: number): string | undefined {
	for (let i = commandIndex + 1; i < tokens.length; i++) {
		const token = tokens[i];
		if (token === "-c" || token === "--command" || (/^-[^-]*c[^-]*$/.test(token) && token !== "-")) {
			return tokens[i + 1];
		}
		if (!token.startsWith("-")) break;
	}
	return undefined;
}

function extractExecutableNames(command: string, depth = 0): string[] {
	if (depth > 2) return [];

	const names = new Set<string>();

	for (const segment of splitCommandSegments(command)) {
		const tokens = tokenizeShellWords(segment);
		if (tokens.length === 0) continue;

		let commandIndex = -1;
		let commandName: string | null = null;

		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i];
			const normalized = normalizeExecutableName(token);
			if (!normalized) continue;

			if (WRAPPER_COMMANDS.has(normalized)) continue;

			commandIndex = i;
			commandName = normalized;
			break;
		}

		if (!commandName) continue;
		names.add(commandName);

		if (SHELL_COMMANDS.has(commandName)) {
			const inlineCommand = findShellInlineCommand(tokens, commandIndex);
			if (inlineCommand) {
				for (const nestedName of extractExecutableNames(inlineCommand, depth + 1)) {
					names.add(nestedName);
				}
			}
		}
	}

	return [...names];
}

function findGuardMatches(command: string): GuardMatch[] {
	const matches = new Map<string, GuardMatch>();

	for (const executable of extractExecutableNames(command)) {
		for (const family of GUARDED_CLI_FAMILIES) {
			if (!family.patterns.some((pattern) => pattern.test(executable))) continue;
			matches.set(`${family.label}:${executable}`, { family, executable });
		}
	}

	return [...matches.values()];
}

function formatMatchSummary(matches: GuardMatch[]): string {
	const grouped = new Map<string, Set<string>>();

	for (const match of matches) {
		const executables = grouped.get(match.family.label) ?? new Set<string>();
		executables.add(match.executable);
		grouped.set(match.family.label, executables);
	}

	return [...grouped.entries()]
		.map(([label, executables]) => `${label}: ${[...executables].join(", ")}`)
		.join("\n");
}

async function confirmGuardedCommand(
	ctx: ExtensionContext,
	sourceLabel: string,
	command: string,
	matches: GuardMatch[],
): Promise<boolean> {
	if (!ctx.hasUI) return false;

	return ctx.ui.confirm(
		"Approve guarded CLI command?",
		[
			`${sourceLabel} matched a guarded executable.`,
			"",
			formatMatchSummary(matches),
			"",
			"Command:",
			command,
		].join("\n"),
	);
}

export default function (pi: ExtensionAPI) {
	pi.on("tool_call", async (event, ctx) => {
		if (event.toolName !== "bash") return;

		const command = typeof event.input.command === "string" ? event.input.command : "";
		const matches = findGuardMatches(command);
		if (matches.length === 0) return;

		const approved = await confirmGuardedCommand(ctx, "Agent bash tool call", command, matches);
		if (!approved) {
			return {
				block: true,
				reason: ctx.hasUI
					? "Blocked by user (guarded CLI approval denied)"
					: `Blocked without UI: guarded CLI approval required for ${matches.map((m) => m.executable).join(", ")}`,
			};
		}
	});

	pi.on("user_bash", async (event, ctx) => {
		const matches = findGuardMatches(event.command);
		if (matches.length === 0) return;

		const approved = await confirmGuardedCommand(ctx, "User bash command", event.command, matches);
		if (approved) return;

		const output = ctx.hasUI
			? "Blocked by user (guarded CLI approval denied)."
			: `Blocked without UI: guarded CLI approval required for ${matches.map((m) => m.executable).join(", ")}`;

		return {
			result: {
				output,
				exitCode: 1,
				cancelled: false,
				truncated: false,
			},
		};
	});
}
