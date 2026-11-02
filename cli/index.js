#!/usr/bin/env node

import fs from "node:fs/promises";
import {
  validatePackage,
  resolveNpmNames,
  resolveGitUrls,
  resolveDependencyRepos
} from "../src/v2/index.js";

const packageJson = JSON.parse(
  await fs.readFile(new URL("../package.json", import.meta.url), "utf8")
);
const VERSION = packageJson.version;

function help() {
  console.log(`npm-repo-resolver v${VERSION}

Step-by-step NPM to Git Repository Explorer.

Usage:
  npx npm-repo-resolver <package-name> [flags]

The 3-Step Journey:
  1. Guard / Validate:
     npx npm-repo-resolver <pkg> --guard      Check if input is valid (YES / NO)

  2. Recursive NPM Names:
     npx npm-repo-resolver <pkg> --names      Return array of strings (NPM names only)

  3. Git Links:
     npx npm-repo-resolver <pkg> --urls       Return array of Git repository URLs
     npx npm-repo-resolver <pkg> --table      Display human-readable summary table
     npx npm-repo-resolver <pkg> --json       Output verified JSON Source of Truth

General Options:
  --count       Output only the total count of discovered repositories
  --pretty      Output formatted JSON
  -v, --version Show version number
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

  // =========================================================================
  // JOURNEY STEP 1: Guard / Validate (YES / NO)
  // =========================================================================
  if (isGuard) {
    try {
      const target = validatePackage(packageSpec);
      console.log(`Valid: YES`);
      console.log(`Package: ${target.name}`);
      console.log(`Version: ${target.version || "latest"}`);
      console.log(`Scope: ${target.scope || "none"}`);
      console.log(`Owner: ${target.owner || "none"}`);
    } catch (err) {
      console.log(`Valid: NO`);
      console.error(`Error: ${err.message}`);
      process.exitCode = 1;
    }
    return;
  }

  // =========================================================================
  // JOURNEY STEP 2: Recursive NPM Names Only (Array of strings)
  // =========================================================================
  if (isNames) {
    console.error(`\n🔍 [Step 2] Collecting recursive npm package names for "${packageSpec}"...`);
    const names = await resolveNpmNames(packageSpec);
    console.error(`📦 Discovered ${names.length} npm dependency packages:\n`);
    console.log(JSON.stringify(names, null, 2));
    return;
  }

  // =========================================================================
  // JOURNEY STEP 3: Git URLs (Array of Git URL strings)
  // =========================================================================
  if (isUrls) {
    console.error(`\n🔍 [Step 3] Resolving Git repository links for "${packageSpec}"...`);
    const urls = await resolveGitUrls(packageSpec);
    console.error(`✨ Discovered ${urls.length} Git repository URLs:\n`);
    console.log(JSON.stringify(urls, null, 2));
    return;
  }

  // =========================================================================
  // FULL JOURNEY: Full Repository Resolution
  // =========================================================================
  if (!isCount && !isJson) {
    console.error(`\n🔍 Resolving dependency repositories for "${packageSpec}"...`);
  }

  const repositories = await resolveDependencyRepos(packageSpec);

  if (isCount) {
    console.log(repositories.length);
    return;
  }

  // Table output (default when interactive, or explicit --table)
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
    console.error(`\n💡 Tip: Use --names for npm package array, --urls for Git URLs, or --json for raw data.`);
    return;
  }

  // Default stdout for pipes / scripts / --json: JSON stream
  const jsonOutput = isPretty
    ? JSON.stringify(repositories, null, 2)
    : JSON.stringify(repositories);

  console.log(jsonOutput);
}

main().catch((error) => {
  console.error(`\nnpm-repo-resolver error: ${error.message}\n`);
  process.exitCode = 1;
});
