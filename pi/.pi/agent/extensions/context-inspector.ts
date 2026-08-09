import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import {
	CONFIG_DIR_NAME,
	estimateTokens,
	formatSkillsForPrompt,
	getAgentDir,
	getMarkdownTheme,
	sessionEntryToContextMessages,
	type BuildSystemPromptOptions,
	type ExtensionAPI,
	type ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent";
import { Markdown } from "@earendil-works/pi-tui";

type Count = {
	chars: number;
	tokens: number;
};

type UsageTotals = {
	input: number;
	output: number;
	total: number;
};

const countText = (text: string): Count => ({
	chars: text.length,
	tokens: Math.ceil(text.length / 4),
});

const buildUserSystemPrompt = (options: BuildSystemPromptOptions, cwd: string): string => {
	const parts: string[] = [];

	if (options.appendSystemPrompt) {
		parts.push(options.appendSystemPrompt);
	}

	if (options.contextFiles && options.contextFiles.length > 0) {
		parts.push("<project_context>");
		for (const file of options.contextFiles) {
			parts.push(`<project_instructions path="${file.path}">\n${file.content}\n</project_instructions>`);
		}
		parts.push("</project_context>");
	}

	if (options.skills && options.skills.length > 0) {
		parts.push(formatSkillsForPrompt(options.skills));
	}

	parts.push(`Current working directory: ${cwd.replace(/\\/g, "/")}`);
	return parts.join("\n\n");
};

const SEPARATOR = "——————————————————————————————————";

const formatSection = (rows: Array<{ count: Count; label: string }>, totalTokens: number): string[] => {
	if (rows.length === 0) {
		return ["[0 tokens] / 0 chars — (none)", SEPARATOR, `TOTAL: ${totalTokens.toLocaleString()} tokens`];
	}

	const tokenStrings = rows.map((row) => `[${row.count.tokens.toLocaleString()} tokens]`);
	const charStrings = rows.map((row) => `${row.count.chars.toLocaleString()} chars`);
	const maxTokenWidth = Math.max(...tokenStrings.map((s) => s.length), 0);
	const maxCharWidth = Math.max(...charStrings.map((s) => s.length), 0);

	const out = rows.map(
		(row, i) => `${tokenStrings[i].padStart(maxTokenWidth)} / ${charStrings[i].padStart(maxCharWidth)} — ${row.label}`,
	);
	out.push(SEPARATOR);
	out.push(`TOTAL: ${totalTokens.toLocaleString()} tokens`);
	return out;
};

const readText = (path: string): string | undefined => {
	try {
		return readFileSync(path, "utf8");
	} catch {
		return undefined;
	}
};

const escapeXml = (value: string): string =>
	value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\"/g, "&quot;")
		.replace(/'/g, "&apos;");

const skillBlock = (skill: NonNullable<BuildSystemPromptOptions["skills"]>[number]): string =>
	[
		"  <skill>",
		`    <name>${escapeXml(skill.name)}</name>`,
		`    <description>${escapeXml(skill.description)}</description>`,
		`    <location>${escapeXml(skill.filePath)}</location>`,
		"  </skill>",
	].join("\n");

const sourcePathFor = (content: string | undefined, cwd: string, filename: string): string | undefined => {
	if (!content) return undefined;

	const agentDir = getAgentDir?.() ?? join(homedir(), ".pi", "agent");
	const candidates = [join(cwd, CONFIG_DIR_NAME, filename), join(agentDir, filename)];
	return candidates.find((path) => existsSync(path) && readText(path) === content);
};

const collectUsageTotals = (ctx: ExtensionCommandContext): UsageTotals => {
	const totals: UsageTotals = { input: 0, output: 0, total: 0 };

	for (const entry of ctx.sessionManager.getEntries() as Array<Record<string, any>>) {
		const usage =
			entry.type === "message"
				? entry.message?.usage
				: entry.type === "branch_summary" || entry.type === "compaction"
					? entry.usage
					: undefined;
		if (!usage) continue;

		totals.input += usage.input ?? 0;
		totals.output += usage.output ?? 0;
		totals.total += (usage.input ?? 0) + (usage.output ?? 0);
	}

	return totals;
};

const estimateConversationTokens = (ctx: ExtensionCommandContext): number =>
	ctx.sessionManager
		.buildContextEntries()
		.flatMap(sessionEntryToContextMessages)
		.reduce((total, message) => total + estimateTokens(message), 0);

const estimateToolTokens = (pi: ExtensionAPI): Array<{ name: string; count: Count }> => {
	const activeNames = new Set(pi.getActiveTools());
	return pi
		.getAllTools()
		.filter((tool) => activeNames.has(tool.name))
		.map((tool) => ({
			name: tool.name,
			// Providers serialize tools differently. This is a stable, comparable approximation
			// of the definition Pi supplies to a provider.
			count: countText(JSON.stringify({ name: tool.name, description: tool.description, parameters: tool.parameters })),
		}))
		.sort((a, b) => b.count.tokens - a.count.tokens || a.name.localeCompare(b.name));
};

type ContextReport = { report: string };

const buildReport = (pi: ExtensionAPI, ctx: ExtensionCommandContext): string => {
	const options = ctx.getSystemPromptOptions();
	const effectiveSystemPrompt = ctx.getSystemPrompt();
	const lines: string[] = ["# Context"];

	const systemFiles: Array<{ name: string; content: string }> = [];
	const systemPath = sourcePathFor(options.customPrompt, ctx.cwd, "SYSTEM.md");
	if (options.customPrompt) {
		systemFiles.push({
			name: systemPath ? "SYSTEM.md" : "Custom system prompt",
			content: options.customPrompt,
		});
	}
	const appendPath = sourcePathFor(options.appendSystemPrompt, ctx.cwd, "APPEND_SYSTEM.md");
	if (options.appendSystemPrompt) {
		systemFiles.push({
			name: appendPath ? "APPEND_SYSTEM.md" : "Appended system prompt",
			content: options.appendSystemPrompt,
		});
	}
	for (const file of options.contextFiles ?? []) {
		systemFiles.push({ name: file.path, content: file.content });
	}

	lines.push("");
	lines.push("## System prompt files");
	lines.push(
		...formatSection(
			systemFiles.map((file) => ({ count: countText(file.content), label: file.name })),
			countText(systemFiles.map((file) => file.content).join("")).tokens,
		),
	);

	const skills = options.skills ?? [];
	const visibleSkills = skills.filter((skill) => !skill.disableModelInvocation && (options.selectedTools?.includes("read") ?? true));
	const skillsPrompt = formatSkillsForPrompt(visibleSkills);
	const skillBlocksLength = visibleSkills.reduce((total, skill) => total + skillBlock(skill).length, 0);
	const skillRows: Array<{ count: Count; label: string }> = [];
	for (const skill of skills) {
		const isVisible = visibleSkills.includes(skill);
		skillRows.push({
			count: isVisible ? countText(skillBlock(skill)) : { chars: 0, tokens: 0 },
			label: isVisible ? `${skill.name} (manifest)` : `${skill.name} (not in system prompt)`,
		});
		const skillFile = readText(skill.filePath);
		if (skillFile !== undefined) {
			skillRows.push({ count: countText(skillFile), label: skill.filePath });
		}
	}
	const framing = skillsPrompt.length - skillBlocksLength;
	if (framing > 0) {
		skillRows.push({ count: countText(" ".repeat(framing)), label: "framing/instructions" });
	}

	lines.push("");
	lines.push("## Skills");
	lines.push(...formatSection(skillRows, countText(skillsPrompt).tokens));

	const toolCounts = estimateToolTokens(pi);
	lines.push("");
	lines.push("## Active tools");
	lines.push(
		...formatSection(
			toolCounts.map((tool) => ({ count: tool.count, label: tool.name })),
			toolCounts.reduce((total, tool) => total + tool.count.tokens, 0),
		),
	);

	const staticSystem = countText(effectiveSystemPrompt);
	const conversationTokens = estimateConversationTokens(ctx);
	const toolTokenTotal = toolCounts.reduce((total, tool) => total + tool.count.tokens, 0);
	const toolCharTotal = toolCounts.reduce((total, tool) => total + tool.count.chars, 0);
	const estimatedCombined = staticSystem.tokens + toolTokenTotal + conversationTokens;
	const contextUsage = ctx.getContextUsage();
	const usageTotals = collectUsageTotals(ctx);

	const userSystemPrompt = buildUserSystemPrompt(options, ctx.cwd);
	const userContextCount = countText(userSystemPrompt);
	const builtinPromptCount = {
		chars: Math.max(0, staticSystem.chars - userContextCount.chars),
		tokens: Math.max(0, staticSystem.tokens - userContextCount.tokens),
	};

	lines.push("");
	lines.push("## Current context");
	const contextRows: Array<{ count: Count; label: string }> = [
		{ count: builtinPromptCount, label: "Pi built-in system prompt" },
		{ count: userContextCount, label: "Context files + skills + append" },
		{ count: { chars: 0, tokens: conversationTokens }, label: "Conversation" },
		{ count: { chars: toolCharTotal, tokens: toolTokenTotal }, label: "Tools" },
	];
	if (contextUsage?.tokens !== null) {
		contextRows.push({
			count: { chars: 0, tokens: contextUsage.tokens },
			label: `Provider-reported (${contextUsage.percent?.toFixed(1)}%)`,
		});
	}
	lines.push(...formatSection(contextRows, estimatedCombined));

	lines.push("");
	lines.push("## Cumulative session usage");
	lines.push(
		...formatSection(
			[
				{ count: { chars: 0, tokens: usageTotals.input }, label: "Input" },
				{ count: { chars: 0, tokens: usageTotals.output }, label: "Output" },
			],
			usageTotals.total,
		),
	);

	return lines.join("\n");
};

export default function contextInspector(pi: ExtensionAPI) {
	pi.registerEntryRenderer<ContextReport>("context-report", (entry) => {
		if (!entry.data?.report) return undefined;
		return new Markdown(entry.data.report, 1, 0, getMarkdownTheme());
	});

	pi.registerCommand("context", {
		description: "Show system-prompt, skills, tool, and conversation context usage",
		handler: async (_args, ctx) => {
			// Custom entries are rendered in the transcript but never sent to the model.
			pi.appendEntry<ContextReport>("context-report", { report: buildReport(pi, ctx) });
		},
	});
}
