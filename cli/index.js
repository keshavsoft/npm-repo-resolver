#!/usr/bin/env node

import fs from "node:fs/promises";
import { resolveDependencyRepos } from "../src/index.js";

const packageJson = JSON.parse(
  await fs.readFile(new URL("../package.json", import.meta.url), "utf8")
);
const VERSION = packageJson.version;

function help() {
  console.error(`@keshavsoft/npm-repo-resolver v${VERSION}

Recursively trace npm dependencies and output canonical upstream Git repository remotes
as a verified JSON Source of Truth.

Usage:
  npx @keshavsoft/npm-repo-resolver <package-name> [options]

Options:
  --json        Output clean JSON manifest (default)
  --pretty      Output formatted/indented JSON manifest
  --table       Output formatted summary table
  --count       Output only the unique repository count
  -v, --version Show version number
  -h, --help    Show help

Examples:
  npx @keshavsoft/npm-repo-resolver express
  npx @keshavsoft/npm-repo-resolver @keshavsoft/json-renderers --pretty
  npx @keshavsoft/npm-repo-resolver react > react-repos.json
  npx @keshavsoft/npm-repo-resolver express | npx @keshavsoft/git-sibling-cloner
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
  const isTable = flags.includes("--table");
  const isPretty = flags.includes("--pretty");
  const isCount = flags.includes("--count");

  // Output progress messages to stderr so stdout remains a clean JSON stream for pipes
  if (!isCount) {
    console.error(`\n🔍 Resolving dependency repositories for "${packageSpec}"...`);
  }

  const repositories = await resolveDependencyRepos(packageSpec, {
    onProgress: (event) => {
      if (!isCount) {
        if (event.act === 2 && event.stage === "tree-mapped") {
          console.error(`📦 Mapped dependency tree (${event.count} packages)...`);
        } else if (event.act === 3 && event.stage === "resolved") {
          console.error(`✨ Discovered ${event.uniqueCount} unique Git repositories.\n`);
        }
      }
    }
  });

  if (isCount) {
    console.log(repositories.length);
    return;
  }

  if (isTable) {
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

  // Default stdout: JSON stream
  const jsonOutput = isPretty
    ? JSON.stringify(repositories, null, 2)
    : JSON.stringify(repositories);

  console.log(jsonOutput);
}

main().catch((error) => {
  console.error(`\nnpm-repo-resolver error: ${error.message}\n`);
  process.exitCode = 1;
});
