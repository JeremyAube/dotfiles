---
description: Inspect and safely upgrade one npm dependency, including transitive dependencies and release notes
argument-hint: "<dependency>"
---
Upgrade the npm dependency `$1` in the current repository. The dependency may be direct or transitive.

Use this prompt as a two-phase workflow:

1. **Inspect and propose — no writes.** Trace the dependency, collect security information, read the changelog, assess impact, and show me a complete plan.
2. **Wait for explicit approval.** Do not install, edit source files, alter manifests/lockfiles, stage files, or commit until I explicitly approve the proposed plan. “Yes”, “approve”, “continue”, or an equivalent explicit confirmation is approval. If I ask a question or request a change, remain in phase 1.
3. **Implement only the approved plan.** Upgrade the dependency, make only the necessary mechanical source changes, verify them, and commit the approved upgrade after verification. Report the resulting diff and commit details.

## Tooling

A readable Node helper performs the repetitive npm/GitHub inspection and formats commit messages:

```bash
UPGRADE_HELPER="${HOME}/.pi/agent/bin/npm-security-upgrade.mjs"
node "$UPGRADE_HELPER" inspect "$1" > /tmp/npm-security-upgrade.json
```

If the helper is not installed at that path, look for `pi/.pi/agent/bin/npm-security-upgrade.mjs` in this dotfiles checkout and use that path. Do not recreate the old `npm-security-upgrades` skill or use its batch orchestrator.

The helper uses:

- `npm ls --all --json` to inspect the installed tree and trace every root-to-package path;
- `package.json` and `package-lock.json` to determine directness, declared ranges, installed versions, and affected environments;
- GitHub Dependabot alerts through `gh` when available;
- `npm audit` as additional evidence;
- package metadata from `npm view`;
- GitHub release APIs and versioned `CHANGELOG.md`/`HISTORY.md` files;
- Node rather than a collection of opaque shell scripts.

The helper is read-only during inspection. It must not install packages, edit files, stage changes, or commit.

## Phase 1: inspect before proposing anything

### 1. Establish the repository state

- Confirm the current directory is the repository root with `git rev-parse --show-toplevel`.
- Run `git status --short` and stop if the working tree is not clean. Report the existing changes and ask me to commit or stash them. Never mix pre-existing work into a dependency upgrade.
- Read repository instructions (`AGENTS.md`, `CONTRIBUTING.md`, relevant `README.md`) and inspect the last 20 commit subjects for local test and commit conventions.
- Do not create or switch branches automatically. If a dedicated branch is appropriate, recommend one and ask me to create it separately.
- Confirm that `node`, `npm`, and the helper's required commands are available. If GitHub/Dependabot access is unavailable, say so and clearly distinguish missing evidence from confirmed facts.

### 2. Trace the requested dependency

Run the helper and inspect its JSON output. Include all of the following in the report:

- dependency name;
- each affected manifest/environment;
- whether it is direct or transitive;
- the declared range and all installed versions;
- every complete dependency path, for example `app -> framework -> vulnerable-package`;
- the direct package(s) that can potentially be upgraded for a transitive dependency;
- the exact candidate npm command(s), without running them;
- the reason the helper selected those commands;
- open Dependabot alerts, severity, CVE/GHSA identifiers, vulnerable ranges, patched versions, alert links, and summaries;
- `npm audit` findings and any differences from Dependabot;
- any ambiguity, missing lockfile, missing alert, or unavailable command.

The target version is the smallest version that fixes all alerts for this package in the selected manifest: the highest `first_patched_version` among the package's alerts. Never silently choose `latest` or a version higher than necessary. If there is no Dependabot alert/target, do not infer one from `npm audit`; ask me for an explicit target version and rerun inspection with:

```bash
node "$UPGRADE_HELPER" inspect "$1" --target <target-version> [--manifest <path>]
```

If multiple manifests are affected, treat them as separate environments. Do not combine them into one upgrade or one commit. Ask me which manifest to process first unless the requested target and plan are unambiguous.

### 3. Fetch and display the changelog

For every distinct installed-to-target version pair, include the helper's changelog data in the report:

- versions between the installed version (exclusive) and target (inclusive);
- release names, release bodies, release URLs, and whether each release was found;
- the relevant sections from the versioned `CHANGELOG.md`, `HISTORY.md`, or equivalent when available;
- all changelog/release URLs that will be used in the commit;
- breaking changes, migrations, removals, and deprecations.

Do not summarize away the relevant changelog. Show the actual release-note text or the relevant extracted sections, with links. If no release notes can be fetched, stop and ask whether I want to proceed with that limitation. Never claim a release is safe merely because its GitHub release body is empty.

### 4. Assess impact in the repository

Use the actual repository layout and search for usage of the dependency, its imports, configuration, scripts, and APIs mentioned in the changelog. Prefer `rg` with appropriate extensions and exclude `.git`, `node_modules`, build output, and generated files.

Classify the impact:

- **Minimal:** no breaking change and no affected API usage.
- **Minor:** a small, mechanical source/configuration change (roughly 1–3 locations) whose exact edits can be described.
- **Major:** a migration, configuration redesign, changed behavior, broad API change, or anything whose correctness cannot be established mechanically.

For every breaking/migration note, state whether the repository uses the affected API and cite the matching file paths/locations. Include proposed source edits in the plan, but do not make them yet. For a major impact, recommend blocking rather than automatically migrating.

### 5. Produce the approval report

End the report with a clearly labelled proposal containing:

- selected manifest/environment and current version;
- target version and why it is the minimum safe target;
- direct/transitive upgrade path;
- exact command(s) that will be run after approval;
- source/configuration files that may be changed;
- expected package and lockfile changes;
- verification commands to run;
- risk classification and unresolved concerns;
- the full proposed commit title and body;
- a list of changelog URLs (links only) and all CVE/GHSA links.

The default commit format is:

```text
chore(deps): <package> <old>=> <new>

Upgrades the NPM dependency `<package>` from `<old>` to `<new>`
to fix the following security vulnerabilities.

## Fixed vulnerabilities

- [CVE-...](https://nvd.nist.gov/vuln/detail/CVE-...)
- [GHSA-...](https://github.com/advisories/GHSA-...)

## Release notes

- <online changelog or release URL>
```

Follow repository-specific conventions instead of this default when they are documented. The commit must contain links to online release notes, never pasted changelog content.

Then ask exactly for approval to perform the proposed upgrade. Stop and wait.

## Phase 2: implement after approval

After explicit approval, re-check `git status --short` and confirm it is still clean. If it is not clean, stop. Process only the selected dependency and manifest.

### Direct dependency

Run the exact approved command:

```bash
(cd <environment> && npm install "<package>@<target>")
```

Do not use `--force`, delete the lockfile, or make an unrelated upgrade.

### Transitive dependency

First inspect the candidate direct dependency's available versions and metadata (`npm view`) and confirm that the proposed version is compatible with its declared range and is expected to pull the target vulnerable package. Then run the approved `npm update <direct-package>` or the narrowly scoped `npm install <direct-package>@<version>` command.

Never hand-edit `package-lock.json` to force a transitive version. Do not add an `overrides` entry automatically. If no compatible direct dependency version reaches the target, stop and report the blocked path instead of forcing it.

### Source changes and verification

- Make only the previously approved minimal/mechanical source changes. If implementation reveals a broader migration, stop and ask for a revised approval.
- Verify the installed dependency with `(cd <environment> && npm ls <package>)`; it must resolve to at least the target version and must not show an unresolved invalid tree.
- Run the repository's relevant tests, lint, typecheck, and build commands discovered during inspection. At minimum, run the affected package's test and lint commands when they exist.
- If verification fails because of the upgrade, do not paper over the failure. Report the failure and either fix only an approved mechanical issue or restore the upgrade and document it as blocked.
- Inspect `git diff`, `git diff --check`, and `git status --short`. Confirm that only the selected manifest's package files and approved source files changed.

Before committing, report:

- actual installed version;
- files changed and a concise diff summary;
- verification commands and complete results;
- any remaining warnings;
- the final commit message and release-note links.

If verification passes and the changes match the approved plan, create exactly one commit for this dependency in this environment. Use the Node helper so the message remains consistent:

```bash
node "$UPGRADE_HELPER" commit \
  <package> <old> <new> <CVE-or-GHSA>... \
  --url <changelog-url> \
  --stage <path-to-package.json> \
  --stage <manifest-path> \
  --stage <approved-source-file>
```

Pass every CVE and GHSA for the selected package. Pass every online changelog/release URL used in the approval report. Pass only files belonging to this upgrade with `--stage`; the helper deliberately refuses to stage an implicit set of unrelated changes.

After committing, show the commit hash, `git show --stat --oneline HEAD`, and the final clean/dirty status. Do not push or open a pull request unless separately asked.

## Blocked upgrades

If the upgrade is blocked by an unavailable path, a major migration, an incompatible direct dependency, or failed verification, do not create a dependency commit. With approval if a documentation file would be changed, append—not overwrite—an entry to `security-upgrades-blocked.md` containing:

- package, installed and target versions;
- reason and severity;
- all CVE/GHSA links;
- manifest and complete transitive path;
- attempted upgrade command;
- relevant changelog text and links;
- affected API usage and required code changes;
- verification failure, if applicable.

Show the proposed documentation diff and ask before committing it. Never silently drop a blocked upgrade.
