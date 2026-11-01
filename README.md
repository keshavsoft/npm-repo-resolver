# @keshavsoft/npm-repo-resolver

<p align="center">
  <strong>Recursively trace npm dependencies and discover authentic upstream Git repository remotes as a verified JSON Source of Truth.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@keshavsoft/npm-repo-resolver"><img src="https://img.shields.io/npm/v/@keshavsoft/npm-repo-resolver.svg?style=flat-square&color=cb3837" alt="npm version" /></a>
  <a href="https://github.com/keshavsoft/npm-repo-resolver"><img src="https://img.shields.io/github/stars/keshavsoft/npm-repo-resolver.svg?style=flat-square&logo=github" alt="GitHub stars" /></a>
  <a href="https://github.com/keshavsoft/npm-repo-resolver/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@keshavsoft/npm-repo-resolver.svg?style=flat-square" alt="license" /></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/node/v/@keshavsoft/npm-repo-resolver.svg?style=flat-square" alt="node version" /></a>
</p>

<p align="center">
  <a href="https://github.com/keshavsoft/npm-repo-resolver">🐙 <strong>GitHub Repository</strong></a> •
  <a href="https://www.npmjs.com/package/@keshavsoft/npm-repo-resolver">📦 <strong>View on npm</strong></a> •
  <a href="https://github.com/keshavsoft/npm-source-explorer">🌐 <strong>Parent Suite (npm-source-explorer)</strong></a> •
  <a href="#quick-start">🚀 <strong>Quick Start</strong></a>
</p>

---

## What It Does

`@keshavsoft/npm-repo-resolver` answers one fundamental question for any npm package:

> **"What are the authentic upstream Git repositories behind this package and every single one of its recursive dependencies?"**

Unlike heavy downloaders, this library is **purely analytical and zero-Git**:
- **Zero Disk Bloat:** It does not clone gigabytes of source code or touch your local workspace.
- **Transitive Mapping:** Uses `@npmcli/arborist` in an ephemeral sandbox to compute the complete dependency tree without running untrusted lifecycle scripts.
- **Git Provenance Normalization:** Converts varied metadata formats (`git+https`, SCP, SSH) into canonical HTTPS remotes.
- **Smart Owner Fallback:** Infers missing repository URLs for monorepo packages that omit repository metadata in their `package.json`.
- **Pure Source of Truth:** Outputs an immutable, deduplicated JSON manifest ready for piping into cloners, CI audits, SBOM generators, or security tools.

---

## Quick Start

Run directly via `npx` without installing:

```bash
# Print clean JSON manifest
npx @keshavsoft/npm-repo-resolver express

# Print formatted table to terminal
npx @keshavsoft/npm-repo-resolver express --table

# Indented JSON
npx @keshavsoft/npm-repo-resolver @keshavsoft/json-renderers --pretty

# Save to file
npx @keshavsoft/npm-repo-resolver react > react-repos.json
```

---

## The Composable UNIX Pipeline

Because progress messages are emitted to `stderr` and data is streamed cleanly to `stdout`, you can compose it with any CLI tool:

```bash
# Count discovered upstream repositories
npx @keshavsoft/npm-repo-resolver express --count

# Filter with jq
npx @keshavsoft/npm-repo-resolver express | jq '.[].cloneUrl'

# Pipe directly into the Sibling Cloner
npx @keshavsoft/npm-repo-resolver express | npx @keshavsoft/git-sibling-cloner
```

---

## Output Data Contract (Source of Truth)

Each entry in the output array adheres to a strict schema:

```json
[
  {
    "name": "express",
    "version": "4.18.2",
    "repoUrl": "https://github.com/expressjs/express",
    "cloneUrl": "https://github.com/expressjs/express.git",
    "folder": "express",
    "isInferred": false
  },
  {
    "name": "accepts",
    "version": "1.3.8",
    "repoUrl": "https://github.com/jshttp/accepts",
    "cloneUrl": "https://github.com/jshttp/accepts.git",
    "folder": "accepts",
    "isInferred": false
  }
]
```

---

## Programmatic API (ESM)

```javascript
import { resolveDependencyRepos } from "@keshavsoft/npm-repo-resolver";

const repositories = await resolveDependencyRepos("express", {
  onProgress: (event) => {
    if (event.act === 2 && event.stage === "tree-mapped") {
      console.log(`Mapped tree: ${event.count} packages`);
    } else if (event.act === 3 && event.stage === "resolved") {
      console.log(`Discovered ${event.uniqueCount} distinct repositories.`);
    }
  }
});

console.log(repositories);
```

You can also import lower-level functions:
```javascript
import {
  validatePackage,
  parsePackageSpec,
  buildDependencyTree,
  resolveRepositories,
  normalizeRepoUrl,
  toCloneUrl
} from "@keshavsoft/npm-repo-resolver";
```

---

## Ecosystem

- **Dependency Discovery:** [`@keshavsoft/npm-repo-resolver`](https://github.com/keshavsoft/npm-repo-resolver) *(This package)*
- **Sibling Workspace Cloner:** [`@keshavsoft/git-sibling-cloner`](https://github.com/keshavsoft/git-sibling-cloner)
- **All-in-One CLI Suite:** [`@keshavsoft/npm-source-explorer`](https://github.com/keshavsoft/npm-source-explorer)

---

## Requirements

- **Node.js**: `>=20.0.0`
- **npm**: Installed and in `PATH`

---

## License

This project is licensed under the [MIT License](./LICENSE).  
Copyright © 2026 [KeshavSoft](https://github.com/keshavsoft).
