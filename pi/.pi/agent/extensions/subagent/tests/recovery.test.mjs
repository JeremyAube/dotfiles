// Run: node --test tests/recovery.test.mjs
// No model calls. The test process also serves as a fake Pi child.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

if (process.argv.includes("--mode")) {
	const sessionFile = process.argv[process.argv.indexOf("--session") + 1];
	assert.ok(sessionFile.endsWith("session.jsonl"));
	assert.ok(!process.argv.includes("--no-session"));
	const task = process.argv.at(-1);
	const emit = (event) => {
		const line = JSON.stringify(event) + "\n";
		fs.appendFileSync(sessionFile, line);
		process.stdout.write(line);
	};
	const usage = { input: 100, output: 20, cacheRead: 0, cacheWrite: 0, totalTokens: 120,
		cost: { input: 0.1, output: 0.9, cacheRead: 0, cacheWrite: 0, total: 1 } };
	const assistant = (content, stopReason, extra = {}) => emit({ type: "message_end", message: {
		role: "assistant", content, stopReason, usage, ...extra,
	} });
	emit({ type: "session", cwd: process.cwd(), id: "test" });
	if (task.includes("empty")) process.exit(0);
	assistant([{ type: "text", text: "I changed a file. Verification is pending." },
		{ type: "toolCall", id: "call-1", name: "bash", arguments: { command: "test -f changed.txt" } }], "toolUse");
	emit({ type: "tool_execution_start", toolCallId: "call-1", toolName: "bash", args: { command: "test -f changed.txt" } });
	if (task.includes("cancel")) {
		if (task.includes("stubborn")) process.on("SIGTERM", () => {});
		setInterval(() => {}, 1000);
	} else if (task.includes("signal")) {
		process.kill(process.pid, "SIGTERM");
	} else {
		emit({ type: "message_end", message: { role: "toolResult", toolCallId: "call-1", toolName: "bash",
			content: [{ type: "text", text: "check passed" }] } });
		emit({ type: "tool_execution_end", toolCallId: "call-1", toolName: "bash", isError: false });
		if (task.includes("filter")) {
			assistant([], "error", { errorMessage: "Content filter error" });
		} else if (task.includes("truncated")) {
			process.stdout.write('{"type":');
		} else {
			if (task.includes("retry")) assistant([], "error", { errorMessage: "Temporary error" });
			assistant(task.includes("blank-final") ? [] : [{ type: "text", text: "FIXED" }, { type: "text", text: "Verified." }], "stop");
		}
	}
} else {
	const { test } = await import("node:test");
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "subagent-recovery-test-"));
	process.env.SUBAGENT_TEST_DIR = root;
	fs.mkdirSync(path.join(root, "agents"));
	fs.writeFileSync(path.join(root, "agents", "fixer.md"), "---\nname: fixer\ndescription: Test agent\n---\nFix the task.\n");
	process.on("exit", () => fs.rmSync(root, { recursive: true, force: true }));

	const cli = fs.realpathSync(execFileSync("which", ["pi"], { encoding: "utf8" }).trim());
	const packageDir = process.env.PI_PACKAGE_DIR || path.resolve(path.dirname(cli), "../..");
	const require = createRequire(path.join(packageDir, "package.json"));
	const { createJiti } = require("jiti");
	const aliases = { "@earendil-works/pi-coding-agent": fileURLToPath(new URL("pi-stub.mjs", import.meta.url)) };
	for (const name of ["@earendil-works/pi-ai", "@earendil-works/pi-tui"]) aliases[name] = path.join(packageDir, "node_modules", name, "dist/index.js");
	aliases.typebox = path.join(packageDir, "node_modules/typebox/build/index.mjs");
	const jiti = createJiti(import.meta.url, { alias: aliases });
	const { default: register } = await jiti.import(fileURLToPath(new URL("../index.ts", import.meta.url)));
	let tool;
	register({ registerTool: (definition) => { tool = definition; } });
	const ctx = { cwd: root, hasUI: false };
	const run = (task, signal, onUpdate, params = {}) => tool.execute("test", { agent: "fixer", task, ...params }, signal, onUpdate, ctx);
	const text = (result) => result.content.map((part) => part.text).join("\n");
	const theme = { fg: (_color, value) => value, bold: (value) => value };
	const render = (result, expanded) => tool.renderResult(result, { expanded }, theme, {}).render(120).join("\n");

	await test("success saves a private session and joins all final text blocks", async () => {
		const result = await run("success");
		assert.ok(!result.isError);
		assert.match(text(result), /FIXED\nVerified/);
		const child = result.details.results[0];
		assert.ok(fs.existsSync(child.sessionFile));
		assert.equal(fs.statSync(path.dirname(child.sessionFile)).mode & 0o777, 0o700);
		assert.match(text(result), /Saved session:/);
		assert.equal(result.usage.cost.total, 2);
	});

	await test("provider failure keeps usage, partial work, last action and recovery instructions", async () => {
		const result = await run("filter");
		assert.equal(result.isError, true);
		assert.equal(result.usage.cost.total, 2);
		assert.match(text(result), /Content filter error/);
		assert.match(text(result), /I changed a file/);
		assert.match(text(result), /Last action: bash completed/);
		assert.match(text(result), /Do not restart the full task automatically/);
		assert.match(text(result), /pi --session/);
		assert.equal(result.details.results[0].messages.at(-1).content.length, 0);
		for (const expanded of [false, true]) assert.match(render(result, expanded), /Saved session:/);
	});

	await test("cancellation returns partial results rather than throwing", async () => {
		const controller = new AbortController();
		const result = await run("cancel", controller.signal, (partial) => {
			if (partial.details.results[0].lastAction) controller.abort();
		});
		assert.equal(result.isError, true);
		assert.equal(result.details.results[0].stopReason, "aborted");
		assert.equal(result.usage.cost.total, 1);
		assert.match(text(result), /I changed a file/);
		assert.ok(fs.existsSync(result.details.results[0].sessionFile));
	});

	await test("pre-cancelled work does not start a child", async () => {
		const result = await run("cancel", AbortSignal.abort());
		assert.equal(result.details.results[0].stopReason, "aborted");
		assert.equal(result.details.results[0].sessionFile, undefined);
	});

	await test("cancellation kills a child that ignores TERM", { timeout: 10000 }, async () => {
		const controller = new AbortController();
		const result = await run("stubborn cancel", controller.signal, (partial) => {
			if (partial.details.results[0].lastAction) setTimeout(() => controller.abort(), 100);
		});
		assert.equal(result.details.results[0].stopReason, "aborted");
	});

	await test("signal death, empty output and truncated output are failures", async () => {
		for (const task of ["signal", "empty", "truncated", "blank-final"]) {
			const result = await run(task);
			assert.equal(result.isError, true, task);
			assert.ok(result.details.results[0].sessionFile);
		}
	});

	await test("spawn failure returns diagnostics and does not hang", { timeout: 3000 }, async () => {
		const result = await run("success", undefined, undefined, { cwd: path.join(root, "missing") });
		assert.equal(result.isError, true);
		assert.match(text(result), /ENOENT/);
	});

	await test("successful provider retry clears the old error", async () => {
		const result = await run("retry");
		assert.ok(!result.isError);
		assert.equal(result.details.results[0].errorMessage, undefined);
	});

	await test("chain stops on failure and shows recovery in both views", async () => {
		const result = await run(undefined, undefined, undefined, { agent: undefined, chain: [
			{ agent: "fixer", task: "filter" }, { agent: "fixer", task: "success" },
		] });
		assert.equal(result.isError, true);
		assert.equal(result.details.results.length, 1);
		for (const expanded of [false, true]) assert.match(render(result, expanded), /Content filter error/);
	});

	await test("parallel failures keep every result and report an error", async () => {
		const result = await run(undefined, undefined, undefined, { agent: undefined, tasks: [
			{ agent: "fixer", task: "filter" }, { agent: "fixer", task: "success" },
		] });
		assert.equal(result.isError, true);
		assert.equal(result.details.results.length, 2);
		assert.equal(result.usage.cost.total, 4);
		for (const expanded of [false, true]) assert.match(render(result, expanded), /Content filter error/);
	});
}
