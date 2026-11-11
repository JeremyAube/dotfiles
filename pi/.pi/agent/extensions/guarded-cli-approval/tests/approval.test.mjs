// Run: node --test tests/approval.test.mjs
// Tests inspect event handlers. They do not execute shell commands.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const cli = realpathSync(execFileSync("which", ["pi"], { encoding: "utf8" }).trim());
const packageDir = process.env.PI_PACKAGE_DIR || path.resolve(path.dirname(cli), "../..");
const require = createRequire(path.join(packageDir, "package.json"));
const { createJiti } = require("jiti");
const jiti = createJiti(import.meta.url);
const { default: register } = await jiti.import(fileURLToPath(new URL("../index.ts", import.meta.url)));
const { ALLOWED_CLI_COMMANDS } = await jiti.import(fileURLToPath(new URL("../config.ts", import.meta.url)));
const handlers = {};
register({ on: (name, handler) => { handlers[name] = handler; } });
const agentCall = (command, ctx = { hasUI: false }) => handlers.tool_call({ toolName: "bash", input: { command } }, ctx);

for (const command of [
  "gh pr view", "gh pr view 123 --json title,body", "gh\tpr\tview 123",
  '/opt/homebrew/bin/gh pr view "123"', "GH_TOKEN=example gh pr view 123",
  "env gh pr view 123", "command gh pr view 123", "sudo gh pr view 123",
  "bash -lc 'gh pr view 123'", "gh pr view 123 | head -20",
  "gh pr view 123 && gh pr view 456", "echo ok; gh pr view 123",
]) {
  test(`allows: ${command}`, async () => {
    assert.equal(await agentCall(command), undefined);
    assert.equal(await handlers.user_bash({ command }, { hasUI: false }), undefined);
  });
}

for (const command of [
  "gh", "gh pr merge 123", "gh pr viewer 123", "gh pr view-extra 123",
  "my-gh-wrapper pr view 123", "gh.exe pr view 123",
  "gh pr view 123 && gh pr merge 123", "gh pr merge 123; gh pr view 123",
  "gh pr view 123 | gh api user", "gh pr view 123\ngh pr close 123",
  "gh pr view 123 & gh pr merge 123", "gh pr view 123 || aws s3 ls",
  "bash -lc 'gh pr view 123 && gh pr merge 123'",
  "gh pr view $(gh pr merge 123)", 'gh pr view "`gh pr merge 123`"',
  "gh pr view 123 > output.txt", "gh pr view <(gh pr merge 123)",
  "aws s3 ls", "terraform plan", "ssh host", "kamal deploy", "acli help",
]) {
  test(`requires approval: ${command}`, async () => {
    assert.equal((await agentCall(command)).block, true);
    const result = await handlers.user_bash({ command }, { hasUI: false });
    assert.equal(result.result.exitCode, 1);
  });
}

test("prompts once for a mixed chain and honors approval", async () => {
  let prompts = 0;
  const command = "gh pr view 123 && gh pr merge 123";
  const ctx = { hasUI: true, ui: { confirm: async (_title, message) => {
    prompts++;
    assert.ok(message.includes(command));
    return true;
  } } };
  assert.equal(await agentCall(command, ctx), undefined);
  assert.equal(prompts, 1);
  ctx.ui.confirm = async () => false;
  assert.equal((await agentCall(command, ctx)).block, true);
});

test("exact rules require an exact argument count", async () => {
  const rule = ["gh", "version"];
  ALLOWED_CLI_COMMANDS.push(rule);
  try {
    assert.equal(await agentCall("gh version"), undefined);
    assert.equal((await agentCall("gh version extra")).block, true);
  } finally {
    ALLOWED_CLI_COMMANDS.splice(ALLOWED_CLI_COMMANDS.indexOf(rule), 1);
  }
});

test("ignores other tools and unguarded commands", async () => {
  assert.equal(await handlers.tool_call({ toolName: "read", input: { path: "gh" } }, { hasUI: false }), undefined);
  assert.equal(await agentCall("git status"), undefined);
});
