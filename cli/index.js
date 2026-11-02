#!/usr/bin/env node

import fs from "node:fs/promises";
import { resolveDependencyRepos } from "../src/v4/index.js";
import { collectNpmNames, validatePackage } from "npm-repo-resolver-names";
import { resolveGitLinks } from "npm-repo-resolver-git";

const packageJson = JSON.parse(
  await fs.readFile(new URL("../package.json", import.meta.url), "utf8")
);
const VERSION = packageJson.version;

function help() {
  console.log(`npm-repo-resolver v${VERSION}

Recursively discover authentic Git repository remotes for an npm package and its dependencies.

Usage:
  npx npm-repo-resolver <package-name> [flags]

Flags:
  --names       Output pure array of recursive npm package names
  --urls        Output pure array of Git repository URLs
  --table       Display human-readable summary table (default in terminal)
  --json        Output verified JSON manifest
  --count       Output only total unique repository count
  --guard       Validate package name (YES / NO)
  -v, --version Show version
  -h, --help    Show help
`);
}

async function main() {
  const rawArgs = process.argv.slice(2);
  const flags = rawArgs.filter((arg) => arg.startsWith("-"));
  const positional = rawArgs.filter((arg) => !arg.startsWith("-"));

  if (flags.includes("--version") || flags.includes("-v")) {
    console.log(VERSION);
    return;
  }

  if (flags.includes("--help") || flags.includes("-h") || positional.length === 0) {
    help();
    return;
  }

  const packageSpec = positional[0];
  const isGuard = flags.includes("--guard") || flags.includes("--validate") || flags.includes("-g");
  const isNames = flags.includes("--names") || flags.includes("--npm-names") || flags.includes("-n");
  const isUrls = flags.includes("--urls") || flags.includes("--repos") || flags.includes("-u");
  const isTable = flags.includes("--table") || flags.includes("-t");
  const isPretty = flags.includes("--pretty");
  const isJson = flags.includes("--json");
  const isCount = flags.includes("--count");

  // Step 1: Guard / Validate
  if (isGuard) {
    try {
      const target = validatePackage(packageSpec);
      console.log(`Valid: YES`);
      console.log(`Package: ${target.name}`);
      console.log(`Version: ${target.version || "latest"}`);
      console.log(`Scope: ${target.scope || "none"}`);
    } catch (err) {
      console.log(`Valid: NO`);
      console.error(`Error: ${err.message}`);
      process.exitCode = 1;
    }
    return;
  }

  // Step 2: Names only (delegates to npm-repo-resolver-names)
  if (isNames) {
    console.error(`\n🔍 Collecting recursive npm package names for "${packageSpec}"...`);
    const names = await collectNpmNames(packageSpec);
    console.error(`📦 Discovered ${names.length} npm dependency packages:\n`);
    console.log(JSON.stringify(names, null, 2));
    return;
  }

  // Step 3: URLs only
  if (isUrls) {
    console.error(`\n🔍 Resolving Git repository links for "${packageSpec}"...`);
    const repos = await resolveDependencyRepos(packageSpec);
    const urls = repos.map((r) => r.repoUrl);
    console.error(`✨ Discovered ${urls.length} Git repository URLs:\n`);
    console.log(JSON.stringify(urls, null, 2));
    return;
  }

  // Full Pipeline: resolveDependencyRepos
  if (!isCount && !isJson) {
    console.error(`\n🔍 Resolving dependency repositories for "${packageSpec}"...`);
  }

  const repositories = await resolveDependencyRepos(packageSpec);

  if (isCount) {
    console.log(repositories.length);
    return;
  }

  const isInteractive = Boolean(process.stdout.isTTY);
  if (isTable || (!isJson && isInteractive)) {
    console.error(`✨ Discovered ${repositories.length} authentic Git repositories:\n`);
    console.table(
      repositories.map((r) => ({
        Package: r.name,
        Version: r.version || "-",
        Repository: r.repoUrl,
        Folder: r.folder,
        Inferred: r.isInferred ? "yes" : "no"
      }))
    );
    return;
  }

  const jsonOutput = isPretty
    ? JSON.stringify(repositories, null, 2)
    : JSON.stringify(repositories);

  console.log(jsonOutput);
}

main().catch((err) => {
  console.error(`\nnpm-repo-resolver error: ${err.message}\n`);
  process.exitCode = 1;
});
