# guarded-cli-approval

Pi package/extension that asks for approval before running guarded CLIs.

## Guarded by default

- Terraform (`terraform`, `tf`, wrappers containing `terraform`)
- AWS (`aws`, wrappers containing `aws`)
- Azure (`az` as a name segment)
- Heroku (`heroku`, wrappers containing `heroku`)
- GitHub CLI (`gh` as a name segment), except `gh pr view *`
- SSH (executable names containing `ssh`)
- Kamal (executable names containing `kamal`)
- Atlassian CLI (`acli` as a name segment)

## Customize

Edit `config.ts` and add another entry to `GUARDED_CLI_FAMILIES`.

```ts
{
  label: "Pulumi",
  patterns: [/pulumi/i],
}
```

Use broad patterns for long names and segment-style patterns for short names:

```ts
/pulumi/i
/(?:^|[-_.])tf(?:$|[-_.])/i
```

### Allow specific commands

Edit `ALLOWED_CLI_COMMANDS` in `config.ts`:

```ts
export const ALLOWED_CLI_COMMANDS: string[][] = [
  ["gh", "pr", "view", "*"],
  // ["gh", "issue", "view", "*"],
  // ["aws", "--version"],
];
```

Each array contains an executable name and exact argument words. A final `"*"`
allows zero or more remaining arguments. Without `"*"`, the argument count must
match exactly. No other wildcard syntax is supported. Remove a rule to require
approval again.

The default rule allows `gh pr view`, `gh pr view 123`, and
`gh pr view 123 --json title,body` without approval. It does not allow
`gh pr merge 123` or `gh pr viewer 123`.

Rules apply to each detected invocation separately, including commands in shell
chains and inline commands such as `bash -lc 'gh pr view 123'`.
`gh pr view 123 && gh pr merge 123` still requires approval.
Rules match the exact, case-sensitive executable basename, including when an
absolute path is used. They do not grant exceptions to variants such as
`my-gh-wrapper` or `gh.exe`.

Commands with substitutions, redirections, or shell groups do not receive an
allowlist exception. They still require approval when a guarded executable is
detected. The existing command detector is a simple shell parser, not a security
sandbox. It does not detect every way to invoke a command indirectly.

After changes, run `/reload` in Pi.

## Tests

With Pi installed, run from this directory:

```bash
node --test tests/approval.test.mjs
```

The tests do not execute the shell commands under test.

## Load it

Local package:

```bash
pi install ./extensions/guarded-cli-approval
```

Or add it to settings:

```json
{
  "packages": ["./extensions/guarded-cli-approval"]
}
```
