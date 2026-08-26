/**
 * Private friction log for agents.
 *
 * Models call `papercut` when they hit a dead-end tool, broken link, flaky
 * command, missing helper, or footgun config. Entries append to
 * ~/.pi/agent/papercuts.md. Review with /papercuts.
 */

import { StringEnum } from "@earendil-works/pi-ai";
import { getAgentDir, type ExtensionAPI, type ExtensionContext } from "@earendil-works/pi-coding-agent";
import { matchesKey, Text, truncateToWidth } from "@earendil-works/pi-tui";
import { spawn } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { Type } from "typebox";

const AREAS = ["tooling", "docs", "env", "commands", "other"] as const;
const LIST_LIMIT = 20;
const HEADER = "# Papercuts\n\nPrivate friction log. Agents append; you review.\n\n";
const GUI_EDITORS =
	/^(code|cursor|zed|zeditor|subl|sublime_text|open|mate|bbedit|idea|pycharm|webstorm|codium|windsurf)$/;

const PapercutParams = Type.Object({
	friction: Type.String({
		description: "What you hit, and what would have prevented it. One or two sentences. No secrets.",
	}),
	area: Type.Optional(
		StringEnum(AREAS, {
			description: "Where the friction lives",
		}),
	),
});

type PapercutArea = (typeof AREAS)[number];

type PapercutInput = {
	friction: string;
	area?: PapercutArea;
	cwd?: string;
	repo?: string;
	branch?: string;
	model?: string;
};

type PapercutEntry = {
	heading: string;
	friction: string;
};

export function papercutsPath(): string {
	return join(getAgentDir(), "papercuts.md");
}

function pad(value: number): string {
	return String(value).padStart(2, "0");
}

function formatStamp(date = new Date()): string {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatEntry(input: PapercutInput): string {
	const heading = input.area ? `${formatStamp()} · ${input.area}` : formatStamp();
	const lines = [`## ${heading}`, "", input.friction.trim(), ""];

	if (input.cwd) lines.push(`- cwd: \`${input.cwd}\``);
	if (input.repo) {
		lines.push(input.branch ? `- repo: \`${input.repo} @ ${input.branch}\`` : `- repo: \`${input.repo}\``);
	}
	if (input.model) lines.push(`- model: \`${input.model}\``);
	lines.push("");
	return lines.join("\n");
}

export function appendPapercut(input: PapercutInput): void {
	const file = papercutsPath();
	const entry = formatEntry(input);
	mkdirSync(dirname(file), { recursive: true });

	if (!existsSync(file)) {
		writeFileSync(file, HEADER + entry, { encoding: "utf8", mode: 0o600 });
		return;
	}

	appendFileSync(file, entry, "utf8");
}

function readPapercutsFile(): string | undefined {
	try {
		return readFileSync(papercutsPath(), "utf8");
	} catch {
		return undefined;
	}
}

export function parsePapercuts(content: string): PapercutEntry[] {
	return content
		.split(/^## /m)
		.slice(1)
		.map((chunk) => {
			const newline = chunk.indexOf("\n");
			const heading = (newline === -1 ? chunk : chunk.slice(0, newline)).trim();
			const body = (newline === -1 ? "" : chunk.slice(newline + 1)).trim();
			const friction = body.split(/\n- (?:cwd|repo|model):/)[0]?.trim() ?? "";
			return { heading, friction };
		});
}

async function gitContext(
	pi: ExtensionAPI,
	cwd: string,
	signal?: AbortSignal,
): Promise<{ repo?: string; branch?: string }> {
	try {
		const top = await pi.exec("git", ["rev-parse", "--show-toplevel"], { cwd, timeout: 1500, signal });
		if (top.code !== 0) return {};

		const repo = basename(top.stdout.trim());
		const branch = await pi.exec("git", ["branch", "--show-current"], { cwd, timeout: 1500, signal });
		return {
			repo: repo || undefined,
			branch: branch.stdout.trim() || undefined,
		};
	} catch {
		return {};
	}
}

function modelId(ctx: ExtensionContext): string | undefined {
	if (!ctx.model) return undefined;
	return `${ctx.model.provider}/${ctx.model.id}`;
}

function looksLikeGuiEditor(command: string): boolean {
	return GUI_EDITORS.test(basename(command.trim().split(/\s+/)[0] ?? ""));
}

function spawnDetached(command: string, args: string[], onError: () => void): void {
	const child = spawn(command, args, { detached: true, stdio: "ignore" });
	child.on("error", onError);
	child.unref();
}

function openPapercutsFile(notify: (message: string, type?: "info" | "warning" | "error") => void): void {
	const file = papercutsPath();
	const editor = process.env.VISUAL || process.env.EDITOR;
	const fail = () => notify(`Could not open ${file}`, "error");

	if (editor) {
		const parts = editor.trim().split(/\s+/).filter(Boolean);
		const command = parts[0];
		if (command && looksLikeGuiEditor(command)) {
			spawnDetached(command, [...parts.slice(1), file], fail);
			return;
		}
	}

	if (process.platform === "darwin") {
		spawnDetached("open", ["-t", file], fail);
		return;
	}

	notify(file, "info");
}

function firstLine(text: string, width: number): string {
	const line = text.split("\n")[0]?.trim() ?? "";
	return truncateToWidth(line, width);
}

export default function (pi: ExtensionAPI) {
	pi.registerTool({
		name: "papercut",
		label: "Papercut",
		description:
			"Log workflow friction (dead-end tool, broken link, flaky command, missing helper, footgun config) and continue. Do not stop working.",
		promptSnippet: "Log a dead-end, broken link, flaky command, or other workflow friction, then continue",
		promptGuidelines: [
			"Use papercut when you hit friction: a dead-end tool, broken link, flaky command, missing helper, or footgun config. File it and continue. Do not stop working. Do not log secrets, tokens, or raw command dumps.",
		],
		parameters: PapercutParams,

		async execute(_toolCallId, params, signal, _onUpdate, ctx) {
			const friction = params.friction.trim();
			if (!friction) {
				return { content: [{ type: "text", text: "Skipped empty papercut." }] };
			}

			const git = await gitContext(pi, ctx.cwd, signal);
			try {
				appendPapercut({
					friction,
					area: params.area,
					cwd: ctx.cwd,
					repo: git.repo,
					branch: git.branch,
					model: modelId(ctx),
				});
			} catch {
				return { content: [{ type: "text", text: "Failed to log papercut." }] };
			}

			return { content: [{ type: "text", text: "Logged papercut." }] };
		},

		renderCall(args, theme) {
			const area = args.area ? theme.fg("muted", args.area) : theme.fg("dim", "papercut");
			const preview = args.friction ? theme.fg("dim", firstLine(String(args.friction), 60)) : "";
			return new Text(theme.fg("toolTitle", theme.bold("papercut ")) + area + (preview ? ` ${preview}` : ""), 0, 0);
		},

		renderResult(_result, _options, theme) {
			return new Text(theme.fg("success", "logged"), 0, 0);
		},
	});

	pi.registerCommand("papercuts", {
		description: "Show recent papercuts, or open / path the log file",
		getArgumentCompletions: (prefix: string) => {
			const items = [
				{ value: "open", label: "Open papercuts.md in an editor" },
				{ value: "path", label: "Print the papercuts.md path" },
			];
			const filtered = items.filter((item) => item.value.startsWith(prefix));
			return filtered.length > 0 ? filtered : null;
		},
		handler: async (args, ctx) => {
			const action = args.trim();
			const file = papercutsPath();

			if (action === "path") {
				if (ctx.hasUI) ctx.ui.notify(file, "info");
				return;
			}

			if (action === "open") {
				if (!existsSync(file)) {
					if (ctx.hasUI) ctx.ui.notify("No papercuts logged yet", "info");
					return;
				}
				if (ctx.hasUI) openPapercutsFile(ctx.ui.notify);
				return;
			}

			if (action) {
				if (ctx.hasUI) ctx.ui.notify("Usage: /papercuts [open|path]", "warning");
				return;
			}

			const content = readPapercutsFile();
			const entries = content ? parsePapercuts(content) : [];

			if (ctx.mode !== "tui") {
				if (ctx.hasUI) {
					ctx.ui.notify(
						entries.length === 0 ? "No papercuts logged yet" : `${entries.length} papercut(s) in ${file}`,
						"info",
					);
				}
				return;
			}

			const recent = entries.slice(-LIST_LIMIT).reverse();

			await ctx.ui.custom<void>((_tui, theme, _kb, done) => ({
				render: (width: number) => {
					const lines: string[] = [""];
					const title = theme.fg("accent", " Papercuts ");
					lines.push(
						truncateToWidth(
							theme.fg("borderMuted", "─".repeat(3)) + title + theme.fg("borderMuted", "─".repeat(Math.max(0, width - 14))),
							width,
						),
					);
					lines.push("");

					if (recent.length === 0) {
						lines.push(truncateToWidth(`  ${theme.fg("dim", "No papercuts yet.")}`, width));
					} else {
						lines.push(
							truncateToWidth(
								`  ${theme.fg("muted", `${entries.length} total · last ${recent.length}`)}`,
								width,
							),
						);
						lines.push("");
						for (const entry of recent) {
							lines.push(truncateToWidth(`  ${theme.fg("accent", entry.heading)}`, width));
							if (entry.friction) {
								lines.push(truncateToWidth(`    ${theme.fg("muted", firstLine(entry.friction, width - 6))}`, width));
							}
						}
					}

					lines.push("");
					lines.push(truncateToWidth(`  ${theme.fg("dim", "Escape to close · /papercuts open to edit")}`, width));
					lines.push("");
					return lines;
				},
				invalidate: () => {},
				handleInput: (data: string) => {
					if (matchesKey(data, "escape") || matchesKey(data, "enter") || matchesKey(data, "ctrl+c")) {
						done();
					}
				},
			}));
		},
	});
}
