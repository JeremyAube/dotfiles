#!/usr/bin/env node
/**
 * Read-only discovery and commit-message helper for /npm-security-upgrade.
 *
 * The agent performs the actual install, code edits, verification, and user
 * interaction. This program keeps the repetitive dependency inspection and
 * GitHub/npm plumbing in one readable, reusable Node program.
 */

import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import process from "node:process";

const MAX_BUFFER = 20 * 1024 * 1024;
const CHANGELOG_LIMIT = 30_000;

function command(name, args, options = {}) {
  const result = spawnSync(name, args, {
    cwd: options.cwd,
    encoding: "utf8",
    input: options.input,
    maxBuffer: MAX_BUFFER,
  });

  return {
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    error: result.error?.message,
  };
}

function outputOf(name, args, options = {}) {
  const result = command(name, args, options);
  if (!result.ok) {
    const details = result.error || result.stderr.trim() || `exit ${result.status}`;
    throw new Error(`${name} ${args.join(" ")} failed: ${details}`);
  }
  return result.stdout.trim();
}

function jsonOutputOf(name, args, options = {}) {
  const result = command(name, args, options);
  if (!result.ok) return { value: null, error: result.error || result.stderr.trim() };

  try {
    return { value: JSON.parse(result.stdout), error: null };
  } catch (error) {
    return { value: null, error: `Invalid JSON from ${name}: ${error.message}` };
  }
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function flattenPages(value) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((page) => (Array.isArray(page) ? page : [page]));
}

function normaliseManifestPath(value) {
  // GitHub reports Dependabot manifest paths with a leading slash, while
  // local paths are relative to the repository root.
  return String(value ?? "").replace(/^\/+/, "") || "package-lock.json";
}

function versionParts(value) {
  const match = String(value ?? "").trim().replace(/^v/i, "").match(
    /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?/,
  );
  if (!match) return null;

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4]?.split(".") ?? [],
    original: value,
  };
}

function compareVersions(left, right) {
  const a = versionParts(left);
  const b = versionParts(right);
  if (!a || !b) return String(left).localeCompare(String(right));

  for (const key of ["major", "minor", "patch"]) {
    if (a[key] !== b[key]) return a[key] - b[key];
  }

  if (a.prerelease.length === 0 && b.prerelease.length > 0) return 1;
  if (a.prerelease.length > 0 && b.prerelease.length === 0) return -1;
  for (let i = 0; i < Math.max(a.prerelease.length, b.prerelease.length); i += 1) {
    if (a.prerelease[i] === undefined) return -1;
    if (b.prerelease[i] === undefined) return 1;
    const aNumber = /^\d+$/.test(a.prerelease[i]);
    const bNumber = /^\d+$/.test(b.prerelease[i]);
    if (aNumber && bNumber) {
      if (Number(a.prerelease[i]) !== Number(b.prerelease[i])) {
        return Number(a.prerelease[i]) - Number(b.prerelease[i]);
      }
    } else if (aNumber !== bNumber) {
      return aNumber ? -1 : 1;
    } else if (a.prerelease[i] !== b.prerelease[i]) {
      return a.prerelease[i].localeCompare(b.prerelease[i]);
    }
  }
  return 0;
}

function maxVersion(values) {
  return values.filter(Boolean).sort(compareVersions).at(-1) ?? null;
}

function normalisePatchedVersion(value) {
  if (!value || typeof value !== "string") return null;
  const match = value.match(/\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?/);
  return match?.[0] ?? null;
}

function findLockfiles(root) {
  const results = [];
  const ignored = new Set([".git", "node_modules", ".next", "dist", "build"]);

  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (ignored.has(entry.name)) continue;
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile() && entry.name === "package-lock.json") results.push(path);
    }
  }

  visit(root);
  return results.sort();
}

function packageIsInLock(lock, packageName) {
  const packageKeys = Object.keys(lock?.packages ?? {});
  if (packageKeys.some((key) => key === `node_modules/${packageName}`)) return true;
  if (packageKeys.some((key) => key.endsWith(`/node_modules/${packageName}`))) return true;

  function hasNested(dependencies) {
    if (!dependencies || typeof dependencies !== "object") return false;
    if (Object.prototype.hasOwnProperty.call(dependencies, packageName)) return true;
    return Object.values(dependencies).some((entry) => hasNested(entry?.dependencies));
  }

  return hasNested(lock?.dependencies);
}

function installedVersionsInLock(lock, packageName) {
  const versions = [];
  const packages = lock?.packages ?? {};
  const exactKey = `node_modules/${packageName}`;

  for (const [key, entry] of Object.entries(packages)) {
    if ((key === exactKey || key.endsWith(`/node_modules/${packageName}`)) && entry?.version) {
      versions.push(entry.version);
    }
  }

  function visit(dependencies) {
    if (!dependencies || typeof dependencies !== "object") return;
    const entry = dependencies[packageName];
    if (entry?.version) versions.push(entry.version);
    for (const child of Object.values(dependencies)) visit(child?.dependencies);
  }
  visit(lock?.dependencies);

  return unique(versions);
}

function packageJsonFor(manifest) {
  const path = join(dirname(manifest), "package.json");
  return { path, value: readJson(path) };
}

function directRange(packageJson, packageName) {
  for (const field of ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]) {
    const value = packageJson?.[field]?.[packageName];
    if (value) return { field, value };
  }
  return null;
}

function npmTree(directory) {
  // Request the complete tree. Passing a package name to `npm ls` can prune
  // the output and lose the parent chain needed for transitive analysis.
  const result = command("npm", ["ls", "--all", "--json"], { cwd: directory });
  if (!result.stdout.trim()) return { tree: null, error: result.stderr.trim() || "npm ls returned no JSON" };

  try {
    return { tree: JSON.parse(result.stdout), error: null };
  } catch (error) {
    return { tree: null, error: `npm ls returned invalid JSON: ${error.message}` };
  }
}

function dependencyPaths(tree, packageName) {
  const paths = [];
  const direct = [];
  const dependencies = tree?.dependencies ?? {};

  function visit(name, node, path) {
    const nextPath = [...path, name];
    if (name === packageName) {
      paths.push({ path: nextPath, version: node?.version ?? null });
      return true;
    }

    let contains = false;
    for (const [childName, childNode] of Object.entries(node?.dependencies ?? {})) {
      contains = visit(childName, childNode, nextPath) || contains;
    }
    return contains;
  }

  for (const [name, node] of Object.entries(dependencies)) {
    if (visit(name, node, [])) {
      direct.push({ name, installed: node?.version ?? null });
    }
  }

  return { paths, direct };
}

function dependencyPathsFromLock(lock, packageName) {
  // npm ls is the best source when node_modules is present. This fallback
  // keeps path tracing useful from package-lock.json alone as well.
  if (lock?.packages) {
    const packages = lock.packages;
    const root = packages[""] ?? {};

    function packageKey(parentKey, name) {
      let current = parentKey;
      while (true) {
        const candidate = current ? `${current}/node_modules/${name}` : `node_modules/${name}`;
        if (packages[candidate]) {
          const entry = packages[candidate];
          return entry.link && entry.resolved && packages[entry.resolved]
            ? entry.resolved
            : candidate;
        }
        if (!current) break;

        const marker = current.lastIndexOf("/node_modules/");
        if (marker >= 0) current = current.slice(0, marker);
        else if (current.startsWith("node_modules/")) current = "";
        else current = "";
      }
      return packages[name] ? name : null;
    }

    function visit(name, key, path, seen) {
      const entry = packages[key] ?? {};
      const nextPath = [...path, name];
      if (name === packageName) {
        return [{ path: nextPath, version: entry.version ?? null }];
      }
      if (seen.has(key)) return [];

      const nextSeen = new Set(seen).add(key);
      return Object.keys(entry.dependencies ?? {}).flatMap((childName) => {
        const childKey = packageKey(key, childName);
        return childKey ? visit(childName, childKey, nextPath, nextSeen) : [];
      });
    }

    const paths = Object.keys(root.dependencies ?? {}).flatMap((name) => {
      const key = packageKey("", name);
      return key ? visit(name, key, [], new Set()) : [];
    });
    const directNames = new Set(paths.map(({ path }) => path[0]));
    const direct = [...directNames].map((name) => ({
      name,
      installed: packages[packageKey("", name)]?.version ?? null,
    }));
    return { paths, direct };
  }

  return dependencyPaths({ dependencies: lock?.dependencies }, packageName);
}

function repositoryName(value) {
  const candidate = typeof value === "string" ? value : value?.url;
  if (!candidate) return null;
  const match = candidate.match(/github\.com[:/]([^/]+)\/([^/#]+?)(?:\.git)?(?:[#/]|$)/i);
  return match ? `${match[1]}/${match[2]}` : null;
}

function npmView(packageName, field) {
  const result = jsonOutputOf("npm", ["view", packageName, field, "--json", "--no-update-notifier"]);
  return result.value;
}

function dependabotAlerts(repository) {
  if (!repository) return { alerts: [], error: "Could not determine the GitHub repository" };
  const result = jsonOutputOf("gh", [
    "api", "-X", "GET", "--paginate", "--slurp",
    `repos/${repository}/dependabot/alerts`, "-f", "state=open",
  ]);
  if (!result.value) return { alerts: [], error: result.error || "gh is unavailable or unauthenticated" };

  const alerts = flattenPages(result.value)
    .filter((alert) => alert?.dependency?.package?.ecosystem === "npm")
    .map((alert) => ({
      number: alert.number ?? null,
      severity: alert.security_advisory?.severity ?? "unknown",
      package: alert.dependency.package.name,
      manifest: normaliseManifestPath(alert.dependency.manifest_path),
      scope: alert.dependency.scope,
      relationship: alert.dependency.relationship,
      ghsa: alert.security_advisory?.ghsa_id ?? null,
      cve: alert.security_advisory?.cve_id ?? null,
      summary: alert.security_advisory?.summary ?? null,
      vulnerableRange: alert.security_vulnerability?.vulnerable_version_range ?? null,
      allVulnerableRanges: (alert.security_advisory?.vulnerabilities ?? []).map((vulnerability) => ({
        range: vulnerability.vulnerable_version_range ?? null,
        patched: normalisePatchedVersion(vulnerability.first_patched_version?.identifier),
      })),
      patched: normalisePatchedVersion(alert.security_vulnerability?.first_patched_version?.identifier),
      url: alert.html_url ?? null,
      createdAt: alert.created_at ?? null,
    }));

  return { alerts, error: null };
}

function npmAudit(directory, packageName) {
  const result = command("npm", ["audit", "--json"], { cwd: directory });
  if (!result.stdout.trim()) return { findings: [], error: result.stderr.trim() };

  let audit;
  try {
    audit = JSON.parse(result.stdout);
  } catch (error) {
    return { findings: [], error: `npm audit returned invalid JSON: ${error.message}` };
  }

  const vulnerability = audit.vulnerabilities?.[packageName];
  if (!vulnerability) return { findings: [], error: null };

  const advisories = (vulnerability.via ?? []).filter((entry) => typeof entry === "object");
  return {
    error: null,
    findings: [{
      source: "npm audit",
      severity: vulnerability.severity ?? "unknown",
      package: packageName,
      patched: vulnerability.fixAvailable?.name === packageName
        ? normalisePatchedVersion(vulnerability.fixAvailable.version)
        : null,
      fixAvailable: vulnerability.fixAvailable ?? false,
      cves: unique(advisories.flatMap((entry) => [entry.cve, entry.url?.match(/(GHSA-[\w-]+)/)?.[1]])),
      via: advisories.map((entry) => entry.title ?? entry.name ?? entry.url).filter(Boolean),
    }],
  };
}

async function fetchUrl(url, headers = {}) {
  try {
    const response = await fetch(url, { headers });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

function githubJson(repository, path) {
  const result = jsonOutputOf("gh", ["api", "--paginate", "--slurp", `repos/${repository}/${path}`]);
  if (result.value) return flattenPages(result.value);
  return null;
}

async function githubFile(repository, file, tag) {
  const apiPath = `repos/${repository}/contents/${file}?ref=${encodeURIComponent(tag)}`;
  const result = jsonOutputOf("gh", ["api", apiPath]);
  if (result.value?.content) {
    return {
      file,
      tag,
      content: Buffer.from(result.value.content.replaceAll("\n", ""), "base64").toString("utf8"),
      url: result.value.html_url ?? `https://github.com/${repository}/blob/${tag}/${file}`,
    };
  }

  const raw = await fetchUrl(`https://raw.githubusercontent.com/${repository}/${encodeURIComponent(tag)}/${file}`);
  return raw === null ? null : {
    file,
    tag,
    content: raw,
    url: `https://github.com/${repository}/blob/${tag}/${file}`,
  };
}

function headingVersion(line) {
  if (!/^\s*#{1,6}\s/.test(line)) return null;
  return line.match(/(?:^|[\s[(])v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)/)?.[1] ?? null;
}

function relevantChangelog(content, from, to) {
  const lines = content.split("\n");
  const sections = [];
  let current = null;

  for (const line of lines) {
    const version = headingVersion(line);
    if (version) {
      if (current) sections.push(current);
      current = { version, lines: [line] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) sections.push(current);

  const matching = sections.filter((section) => (
    compareVersions(section.version, from) > 0 && compareVersions(section.version, to) <= 0
  ));

  if (matching.length > 0) return matching.map((section) => section.lines.join("\n")).join("\n\n").slice(0, CHANGELOG_LIMIT);
  return content.slice(0, CHANGELOG_LIMIT);
}

function breakingLines(text) {
  return unique(String(text ?? "").split("\n").filter((line) => /breaking|migration|removed|deprecat/i.test(line)));
}

async function changelog(packageName, from, to) {
  if (!versionParts(from) || !versionParts(to)) {
    return { from, to, error: "A concrete installed version is required to fetch release notes." };
  }

  const repositoryUrl = npmView(packageName, "repository.url");
  const repository = repositoryName(repositoryUrl);
  const allVersions = npmView(packageName, "versions");
  const versions = (Array.isArray(allVersions) ? allVersions : [allVersions])
    .filter(Boolean)
    .filter((version) => compareVersions(version, from) > 0 && compareVersions(version, to) <= 0)
    .sort(compareVersions);

  if (!repository) {
    return {
      from, to, repository: repositoryUrl ?? null, versions,
      releases: [], files: [], urls: [], breakingChanges: [],
      error: "The package does not expose a GitHub repository URL.",
    };
  }

  const releaseData = githubJson(repository, "releases?per_page=100") ?? [];
  const releaseByVersion = new Map();
  for (const release of releaseData) {
    const tag = release.tag_name ?? "";
    const releaseVersion = normalisePatchedVersion(tag);
    if (releaseVersion) releaseByVersion.set(releaseVersion, release);
  }

  const releases = versions.map((version) => {
    const release = releaseByVersion.get(version);
    return {
      version,
      tag: release?.tag_name ?? null,
      name: release?.name ?? null,
      body: release?.body ?? null,
      htmlUrl: release?.html_url ?? null,
      found: Boolean(release),
    };
  });

  const tags = [`v${to}`, to];
  const fileNames = ["CHANGELOG.md", "HISTORY.md", "CHANGES.md", "changelog.md", "history.md"];
  let file = null;
  for (const tag of tags) {
    for (const fileName of fileNames) {
      file = await githubFile(repository, fileName, tag);
      if (file) break;
    }
    if (file) break;
  }

  const releaseText = releases.map((release) => release.body ?? "").filter(Boolean).join("\n\n");
  const fileText = file?.content ?? "";
  const relevantContent = fileText ? relevantChangelog(fileText, from, to) : "";
  const urls = unique([
    file?.url,
    ...releases.map((release) => release.htmlUrl),
    `https://github.com/${repository}/compare/v${from}...v${to}`,
  ]);

  return {
    from,
    to,
    repository,
    versions,
    releases,
    files: file ? [{ file: file.file, tag: file.tag, url: file.url }] : [],
    relevantContent,
    urls,
    breakingChanges: breakingLines(`${releaseText}\n${relevantContent}`),
    error: file || releases.some((release) => release.found)
      ? null
      : "No GitHub release body or changelog file could be fetched.",
  };
}

function gitInformation(root) {
  const status = command("git", ["status", "--short"], { cwd: root });
  const branch = command("git", ["branch", "--show-current"], { cwd: root });
  const log = command("git", ["log", "-20", "--format=%s"], { cwd: root });
  return {
    clean: status.ok && status.stdout.trim() === "",
    status: status.stdout.trim().split("\n").filter(Boolean),
    branch: branch.stdout.trim() || null,
    recentCommits: log.stdout.trim().split("\n").filter(Boolean),
  };
}

function severityRank(severity) {
  return { critical: 0, high: 1, medium: 2, low: 3 }[severity] ?? 4;
}

async function inspect(packageName, requestedManifest, requestedTarget) {
  if (requestedTarget && !versionParts(requestedTarget)) {
    throw new Error(`Invalid target version: ${requestedTarget}`);
  }

  const root = resolve(outputOf("git", ["rev-parse", "--show-toplevel"]));
  const repositoryResult = command("gh", ["repo", "view", "--json", "nameWithOwner", "-q", ".nameWithOwner"], { cwd: root });
  const repository = repositoryResult.ok ? repositoryResult.stdout.trim() : null;
  const dependabot = dependabotAlerts(repository);
  const packageAlerts = dependabot.alerts.filter((alert) => alert.package === packageName);
  const selectedManifest = requestedManifest ? resolve(root, requestedManifest) : null;
  const alerts = selectedManifest
    ? packageAlerts.filter((alert) => resolve(root, alert.manifest) === selectedManifest)
    : packageAlerts;

  const lockfiles = selectedManifest
    ? [selectedManifest]
    : findLockfiles(root).filter((path) => packageIsInLock(readJson(path), packageName));

  const alertManifests = selectedManifest
    ? []
    : alerts.map((alert) => resolve(root, alert.manifest));
  for (const manifest of alertManifests) {
    if (!lockfiles.includes(manifest)) lockfiles.push(manifest);
  }

  if (requestedManifest && !lockfiles.every((manifest) => readJson(manifest))) {
    throw new Error(`Could not read the requested manifest: ${requestedManifest}`);
  }

  const contexts = [];
  for (const manifest of lockfiles) {
    const lock = readJson(manifest);
    if (!lock) continue;
    const { path: packageJsonPath, value: packageJson } = packageJsonFor(manifest);
    const direct = directRange(packageJson, packageName);
    const directory = dirname(manifest);
    const treeResult = npmTree(directory);
    const installedTreeInfo = dependencyPaths(treeResult.tree, packageName);
    const treeInfo = installedTreeInfo.paths.length > 0
      ? installedTreeInfo
      : dependencyPathsFromLock(lock, packageName);
    const installedVersions = unique([
      ...installedVersionsInLock(lock, packageName),
      ...treeInfo.paths.map((entry) => entry.version),
    ]);
    const manifestAlerts = alerts.filter((alert) => resolve(root, alert.manifest) === manifest);
    const target = maxVersion([
      ...manifestAlerts.map((alert) => alert.patched),
      requestedTarget,
    ]);
    const directDeps = treeInfo.direct.map((entry) => ({
      ...entry,
      declaredRange: directRange(packageJson, entry.name)?.value ?? null,
      brings: packageName,
    }));
    const pathStrings = treeInfo.paths.map((entry) => entry.path.join(" -> "));

    contexts.push({
      manifest: relative(root, manifest) || "package-lock.json",
      directory: relative(root, directory) || ".",
      packageJson: relative(root, packageJsonPath),
      installed: maxVersion(installedVersions),
      installedVersions,
      isDirect: Boolean(direct),
      declaredRange: direct?.value ?? null,
      dependencyField: direct?.field ?? null,
      directDeps,
      dependencyPaths: pathStrings,
      npmInstallCommands: direct
        ? [`(cd ${relative(root, directory) || "."} && npm install \"${packageName}@${target ?? "<target>"}\")`]
        : directDeps.map((entry) => `(cd ${relative(root, directory) || "."} && npm update \"${entry.name}\")`),
      reason: direct
        ? `Direct dependency declared in ${relative(root, packageJsonPath)} (${direct.field}: ${direct.value}).`
        : directDeps.length > 0
          ? `Transitive dependency. Direct package(s) whose installed subtree contains ${packageName}: ${directDeps.map((entry) => entry.name).join(", ")}.`
          : `No direct dependency path to ${packageName} was found. An override would be required and is not proposed automatically.`,
      alerts: manifestAlerts,
      target,
      npmTreeError: treeResult.error,
    });
  }

  const audit = [];
  const auditErrors = [];
  for (const context of contexts) {
    const result = npmAudit(resolve(root, context.directory), packageName);
    if (result.findings.length > 0) audit.push({ manifest: context.manifest, ...result });
    if (result.error) auditErrors.push({ manifest: context.manifest, error: result.error });
  }

  const targetVersions = unique(contexts.map((context) => context.target).filter(Boolean));
  if (requestedTarget && targetVersions.length === 0) targetVersions.push(requestedTarget);
  const target = targetVersions.length === 1 ? targetVersions[0] : null;
  const installedVersions = unique(contexts.flatMap((context) => context.installedVersions));
  const changelogs = {};
  for (const context of contexts) {
    if (!context.installed || !context.target) continue;
    const key = `${context.installed}->${context.target}`;
    if (!changelogs[key]) {
      changelogs[key] = await changelog(packageName, context.installed, context.target);
    }
  }

  const identifiers = unique(alerts.flatMap((alert) => [alert.cve, alert.ghsa]));
  const severity = alerts
    .map((alert) => alert.severity)
    .sort((a, b) => severityRank(a) - severityRank(b))[0] ?? null;

  return {
    package: packageName,
    repository,
    root,
    git: gitInformation(root),
    alerts,
    audit,
    auditErrors,
    alertErrors: dependabot.error ? [dependabot.error] : [],
    contexts,
    target,
    targetVersions,
    requestedTarget: requestedTarget ?? null,
    installedVersions,
    identifiers,
    severity,
    changelogs,
    defaultCommit: target && contexts.length === 1 && contexts[0].installed
      ? `chore(deps): ${packageName} ${contexts[0].installed}=>${target}`
      : null,
    notes: alerts.length === 0
      ? "No open Dependabot npm alert matched this exact package name. Review the npm audit findings and do not infer a target version without user input."
      : null,
  };
}

function parseOptions(args) {
  const positionals = [];
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--manifest") options.manifest = args[++index];
    else if (arg === "--target") options.target = args[++index];
    else if (arg === "--prefix") options.prefix = args[++index];
    else if (arg === "--lang") options.lang = args[++index];
    else if (arg === "--url") (options.urls ??= []).push(args[++index]);
    else if (arg === "--stage") (options.stage ??= []).push(args[++index]);
    else if (arg === "--json") options.json = true;
    else positionals.push(arg);
  }
  return { positionals, options };
}

function vulnerabilityLink(identifier) {
  if (identifier.startsWith("GHSA-")) return `https://github.com/advisories/${identifier}`;
  if (identifier.startsWith("CVE-")) return `https://nvd.nist.gov/vuln/detail/${identifier}`;
  return null;
}

function commitMessage(packageName, oldVersion, newVersion, identifiers, options) {
  const prefix = options.prefix || "chore(deps)";
  const french = options.lang === "fr";
  const lines = [
    `${prefix}: ${packageName} ${oldVersion}=>${newVersion}`,
    "",
    french
      ? `Met à niveau la dépendance NPM \`${packageName}\` de \`${oldVersion}\` vers \`${newVersion}\``
      : `Upgrades the NPM dependency \`${packageName}\` from \`${oldVersion}\` to \`${newVersion}\``,
    french
      ? "pour corriger les vulnérabilités de sécurité suivantes."
      : "to fix the following security vulnerabilities.",
    "",
  ];

  if (identifiers.length > 0) {
    lines.push(french ? "## Vulnérabilités corrigées" : "## Fixed vulnerabilities", "");
    for (const identifier of identifiers) {
      const link = vulnerabilityLink(identifier);
      lines.push(link ? `- [${identifier}](${link})` : `- ${identifier}`);
    }
    lines.push("");
  }

  lines.push(french ? "## Notes de version" : "## Release notes", "");
  if (options.urls?.length > 0) {
    for (const url of unique(options.urls)) lines.push(`- ${url}`);
  } else {
    lines.push(`- See the official changelog between ${oldVersion} and ${newVersion}.`);
  }
  return lines.join("\n").trimEnd() + "\n";
}

function commit(packageName, oldVersion, newVersion, identifiers, options) {
  if (!options.urls?.length) {
    throw new Error("At least one --url is required so commit release notes contain links, not inlined changelog text.");
  }

  const root = resolve(outputOf("git", ["rev-parse", "--show-toplevel"]));
  const message = commitMessage(packageName, oldVersion, newVersion, identifiers, options);
  if (!options.stage?.length) {
    throw new Error("At least one --stage path is required so unrelated user changes are never staged.");
  }
  const add = command("git", ["add", "--", ...options.stage], { cwd: root });
  if (!add.ok) throw new Error(add.stderr || add.error || "git add failed");

  const result = command("git", ["commit", "-F", "-"], { cwd: root, input: message });
  if (!result.ok) throw new Error(result.stderr || result.error || "git commit failed");
  const hash = outputOf("git", ["rev-parse", "HEAD"], { cwd: root });
  process.stdout.write(JSON.stringify({ hash, message }));
}

function usage() {
  console.error(`Usage:
  npm-security-upgrade.mjs inspect <package> [--manifest path] [--target version]
  npm-security-upgrade.mjs commit-message <package> <old> <new> [CVE/GHSA ...] [--url URL] [--prefix PREFIX] [--lang en|fr]
  npm-security-upgrade.mjs commit <package> <old> <new> [CVE/GHSA ...] --url URL --stage path`);
}

async function main() {
  const [subcommand, ...rawArgs] = process.argv.slice(2);
  const { positionals, options } = parseOptions(rawArgs);

  if (subcommand === "inspect" && positionals[0]) {
    const result = await inspect(positionals[0], options.manifest, options.target);
    process.stdout.write(JSON.stringify(result, null, 2));
    return;
  }

  if ((subcommand === "commit-message" || subcommand === "commit") && positionals.length >= 3) {
    const [packageName, oldVersion, newVersion, ...identifiers] = positionals;
    if (subcommand === "commit-message") {
      process.stdout.write(commitMessage(packageName, oldVersion, newVersion, identifiers, options));
    } else {
      commit(packageName, oldVersion, newVersion, identifiers, options);
    }
    return;
  }

  usage();
  process.exitCode = 2;
}

try {
  await main();
} catch (error) {
  console.error(`npm-security-upgrade: ${error.message}`);
  process.exitCode = 1;
}
