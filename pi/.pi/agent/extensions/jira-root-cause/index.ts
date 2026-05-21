import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

const ENTRY_TYPE = "jira-root-cause-context";
const CACHE_DIR = join(tmpdir(), "pi-jira-root-cause");
const MAX_DESCRIPTION_LENGTH = 1200;

interface JiraContext {
	ticket: string;
	title?: string;
	status?: string;
	issueType?: string;
	description?: string;
	jsonPath?: string;
	fetchedAt: number;
}

function getByPath(value: unknown, path: string[]): unknown {
	let current = value;
	for (const key of path) {
		if (!current || typeof current !== "object" || !(key in current)) return undefined;
		current = (current as Record<string, unknown>)[key];
	}
	return current;
}

function adfToText(node: unknown): string {
	if (!node) return "";
	if (typeof node === "string") return node;
	if (Array.isArray(node)) return node.map(adfToText).filter(Boolean).join("\n");
	if (typeof node !== "object") return "";

	const record = node as Record<string, unknown>;
	const type = typeof record.type === "string" ? record.type : undefined;
	const text = typeof record.text === "string" ? record.text : "";
	const content = Array.isArray(record.content) ? record.content : [];

	if (type === "text") return text;
	if (type === "hardBreak") return "\n";

	const joined = content.map(adfToText).join(type === "paragraph" ? "" : "\n");
	if (type === "paragraph") return joined.trim();
	if (type === "listItem") return joined.trim();
	if (type === "bulletList" || type === "orderedList") {
		return content
			.map((item) => adfToText(item).trim())
			.filter(Boolean)
			.map((item) => `- ${item}`)
			.join("\n");
	}
	return joined;
}

function normalizeText(value: unknown): string | undefined {
	if (typeof value === "string") {
		const trimmed = value.trim();
		return trimmed || undefined;
	}

	if (Array.isArray(value)) {
		const joined = value.map((item) => normalizeText(item)).filter(Boolean).join("\n").trim();
		return joined || undefined;
	}

	if (value && typeof value === "object") {
		const record = value as Record<string, unknown>;
		if (typeof record.name === "string" && record.name.trim()) return record.name.trim();
		if (typeof record.value === "string" && record.value.trim()) return record.value.trim();

		const adfText = adfToText(value).replace(/\n{3,}/g, "\n\n").trim();
		if (adfText) return adfText;
	}

	return undefined;
}

function firstText(payload: unknown, paths: string[][]): string | undefined {
	for (const path of paths) {
		const value = getByPath(payload, path);
		const normalized = normalizeText(value);
		if (normalized) return normalized;
	}
	return undefined;
}

function truncate(text: string | undefined, maxLength: number): string | undefined {
	if (!text) return undefined;
	const compact = text.replace(/\s+/g, " ").trim();
	if (compact.length <= maxLength) return compact;
	return `${compact.slice(0, maxLength - 1).trimEnd()}…`;
}

function extractContext(ticket: string, payload: unknown, jsonPath?: string): JiraContext {
	return {
		ticket,
		title: firstText(payload, [
			["fields", "summary"],
			["summary"],
			["title"],
			["fields", "title"],
		]),
		status: firstText(payload, [
			["fields", "status", "name"],
			["status", "name"],
			["status"],
		]),
		issueType: firstText(payload, [
			["fields", "issuetype", "name"],
			["fields", "issueType", "name"],
			["issueType", "name"],
			["type", "name"],
		]),
		description: truncate(
			firstText(payload, [
				["fields", "description"],
				["description"],
				["fields", "customfield_10000"],
			]),
			MAX_DESCRIPTION_LENGTH,
		),
		jsonPath,
		fetchedAt: Date.now(),
	};
}

function buildTicketSummary(context: JiraContext): string {
	const lines = [`- Ticket: ${context.ticket}`];
	if (context.title) lines.push(`- Title: ${context.title}`);
	if (context.issueType) lines.push(`- Type: ${context.issueType}`);
	if (context.status) lines.push(`- Status: ${context.status}`);
	if (context.description) lines.push(`- Description: ${context.description}`);
	return lines.join("\n");
}

function buildRcaPrompt(context: JiraContext): string {
	const parts = [
		`Run a root cause analysis for Jira ticket ${context.ticket}.`,
		"",
		"This is an analysis-only workflow:",
		"- Do not modify files.",
		"- Do not run mutating shell commands.",
		"- Inspect the repository only with read-only tools and commands.",
		"",
		"Use the Jira payload for this ticket as a primary input, then inspect the codebase as needed to explain what is most likely happening.",
		buildTicketSummary(context),
	];

	if (context.jsonPath) {
		parts.push("", `Jira JSON path (read this file with the read tool): ${context.jsonPath}`);
	}

	parts.push(
		"",
		"Structure the response as:",
		"1. Problem framing",
		"2. Possible root causes",
		"3. Most likely root cause with evidence from the ticket and codebase",
		"4. Recommended fix direction and validation steps",
		"5. Open questions or uncertainties",
		"",
		"Stop after the RCA. Do not implement the fix yet.",
	);

	return parts.join("\n");
}

function buildTicketPromptContext(context: JiraContext, analysisOnly: boolean): string {
	const parts = ["## Active Jira Ticket", buildTicketSummary(context)];

	if (context.jsonPath) {
		parts.push(`- Jira JSON path: ${context.jsonPath}`);
	}

	if (analysisOnly) {
		parts.push(
			"",
			"## RCA Mode",
			"This turn is a read-only root cause analysis for the active Jira ticket.",
			"Do not edit or write files, and do not run mutating shell commands.",
			"Explain plausible root causes, clearly separating evidence from conjecture.",
			"Do not propose a commit message in this RCA-only turn.",
		);
	} else {
		parts.push(
			"",
			"## Commit Message Policy",
			`When the user asks you to fix or implement work for ${context.ticket} and you finish the change, end your response with a proposed commit message in a fenced text block.`,
			"The commit message must be dense but explanatory.",
			"Focus on the failure mode, the root cause, the broken assumption, and why the change is necessary to eliminate or contain that issue.",
			"Do not spend the body narrating file-by-file edits or mechanical code changes unless they matter to the root cause.",
			`Reference ${context.ticket} in the subject or footer. If there is no stronger repository convention in context, use a subject like \`${context.ticket}: <imperative summary>\` and a footer line \`Refs: ${context.ticket}\`.`,
		);
	}

	return parts.join("\n");
}

function isLikelyMutatingCommand(command: string): boolean {
	const compact = command.replace(/\s+/g, " ");
	const patterns = [
		/(^|[;&|]\s*)(rm|mv|cp|touch|mkdir|rmdir|install|chmod|chown|ln)\b/i,
		/(^|[;&|]\s*)git\s+(add|am|apply|bisect|checkout|cherry-pick|clean|commit|merge|mv|rebase|reset|restore|revert|rm|stash|switch|tag)\b/i,
		/(^|[;&|]\s*)(npm|pnpm|yarn|bun)\s+(install|add|remove|unlink|link|up|update)\b/i,
		/(^|[;&|]\s*)(pip|pip3|uv|poetry|bundle|cargo|go)\s+(install|add|remove|update|get)\b/i,
		/(^|[;&|]\s*)sed\s+-i\b/i,
		/(^|[;&|]\s*)perl\s+-pi\b/i,
		/[^-]>|>>|\|\s*tee\b/,
	];

	return patterns.some((pattern) => pattern.test(compact));
}

function isJiraContext(value: unknown): value is JiraContext {
	if (!value || typeof value !== "object") return false;
	const record = value as Record<string, unknown>;
	return typeof record.ticket === "string" && typeof record.fetchedAt === "number";
}

async function persistJiraPayload(ticket: string, rawJson: string): Promise<string> {
	await fs.mkdir(CACHE_DIR, { recursive: true });
	const filePath = join(CACHE_DIR, `${ticket.replace(/[^A-Za-z0-9_.-]/g, "_")}.json`);
	await fs.writeFile(filePath, rawJson, "utf8");
	return filePath;
}

export default function jiraRootCauseExtension(pi: ExtensionAPI) {
	let activeContext: JiraContext | null = null;
	let rcaModeTicket: string | null = null;

	pi.on("session_start", async (_event, ctx) => {
		for (const entry of ctx.sessionManager.getEntries()) {
			if (entry.type === "custom" && entry.customType === ENTRY_TYPE && isJiraContext(entry.data)) {
				activeContext = entry.data;
			}
		}
	});

	pi.on("before_agent_start", async (event) => {
		if (!activeContext) return;

		const analysisOnly = rcaModeTicket === activeContext.ticket;
		return {
			systemPrompt: `${event.systemPrompt}\n\n${buildTicketPromptContext(activeContext, analysisOnly)}`,
		};
	});

	pi.on("tool_call", async (event) => {
		if (!rcaModeTicket) return;

		if (event.toolName === "edit" || event.toolName === "write") {
			return {
				block: true,
				reason: "Blocked: Jira RCA mode is read-only and cannot modify files.",
			};
		}

		if (event.toolName === "bash") {
			const command =
				event.input && typeof event.input === "object" && typeof event.input.command === "string"
					? event.input.command
					: "";
			if (isLikelyMutatingCommand(command)) {
				return {
					block: true,
					reason: "Blocked: Jira RCA mode only allows read-only shell inspection.",
				};
			}
		}
	});

	pi.on("agent_end", async () => {
		rcaModeTicket = null;
	});

	pi.registerCommand("jira-rca", {
		description: "Fetch a Jira work item and run a read-only root cause analysis",
		handler: async (args, ctx) => {
			const ticket = args.trim();
			if (!ticket) {
				ctx.ui.notify("Usage: /jira-rca <TICKET-NUMBER>", "warning");
				return;
			}

			if (!ctx.isIdle()) {
				await ctx.waitForIdle();
			}

			ctx.ui.notify(`Fetching Jira ticket ${ticket}...`, "info");
			const result = await pi.exec("acli", ["jira", "workitem", "view", ticket, "--json"], {
				timeout: 30_000,
			});

			if (result.code !== 0) {
				const detail = (result.stderr || result.stdout || `exit code ${result.code}`).trim();
				ctx.ui.notify(`Failed to fetch ${ticket}: ${detail}`, "error");
				return;
			}

			const rawJson = result.stdout.trim();
			if (!rawJson) {
				ctx.ui.notify(`No JSON returned for ${ticket}.`, "error");
				return;
			}

			let payload: unknown = null;
			let normalizedJson = rawJson;
			try {
				payload = JSON.parse(rawJson);
				normalizedJson = `${JSON.stringify(payload, null, 2)}\n`;
			} catch {
				payload = { ticket, rawOutput: rawJson };
			}

			const jsonPath = await persistJiraPayload(ticket, normalizedJson);
			activeContext = extractContext(ticket, payload, jsonPath);
			pi.appendEntry(ENTRY_TYPE, activeContext);
			rcaModeTicket = ticket;

			ctx.ui.notify(`Starting read-only RCA for ${ticket}`, "info");
			pi.sendUserMessage(buildRcaPrompt(activeContext));
		},
	});
}
