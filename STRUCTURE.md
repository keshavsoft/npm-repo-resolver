# Architecture & Source Layout

<p align="center">
  <a href="https://keshavsoft.github.io/npm-repo-resolver/">🌐 <strong>Live Documentation</strong></a> •
  <a href="https://www.npmjs.com/package/npm-repo-resolver">📦 <strong>npm Package</strong></a> •
  <a href="https://github.com/keshavsoft/npm-repo-resolver">🐙 <strong>GitHub Repository</strong></a> •
  <a href="https://github.com/keshavsoft/npm-repo-resolver#readme">📖 <strong>README</strong></a> •
  <a href="https://github.com/keshavsoft/npm-repo-resolver/issues">🐛 <strong>Issues</strong></a>
</p>

---

## Architecture Philosophy

1. **Pure Discovery, Zero Git:** Focuses exclusively on mapping recursive npm dependencies and extracting canonical Git repository remotes. It does not clone repositories or alter the local workspace.
2. **V1 Versioned Routine:** Code is encapsulated in `src/v1/`, while `src/index.js` acts strictly as the root export router.
3. **The 3-Act Story:**
   - **Act 1: The Gatekeeper (`src/v1/1-gatekeeper/`)** — Validates package specification, parses scopes, and extracts owner identity.
   - **Act 2: The Cartographer (`src/v1/2-cartographer/`)** — Recursively maps the transitive dependency tree inside an isolated sandbox using `@npmcli/arborist`.
   - **Act 3: The Detective (`src/v1/3-detective/`)** — Normalizes Git URLs into canonical HTTPS remotes, infers missing URLs via smart owner fallback, deduplicates, and produces the **Source of Truth** manifest.

```
┌──────────────────────────────────────────────────────────────────┐
│                      The 3-Act Discovery Engine                  │
├───────────────────┬──────────────────────┬───────────────────────┤
│ Act 1             │ Act 2                │ Act 3                 │
│ The Gatekeeper    │ The Cartographer     │ The Detective         │
│ (Validate Target) │ (Map Recursive Tree) │ (Git Provenance & Map)│
└─────────┬─────────┴──────────┬───────────┴───────────┬───────────┘
          │                    │                       │
          ▼                    ▼                       ▼
  ┌──────────────────────────────────────────────────────────────┐
  │                 THE SOURCE OF TRUTH                          │
  │        (Canonical Git Provenance Manifest - JSON)            │
  └──────────────────────────────────────────────────────────────┘
```

---

## Directory Overview

```
npm-repo-resolver/
├── cli/
│   └── index.js             # CLI runner with --json, --pretty, --table, --count
├── docs/
│   ├── .nojekyll            # Prevents Jekyll build override on GitHub Pages
│   └── index.html           # Live documentation website
├── src/
│   ├── index.js             # Root export pointing to ./v1/index.js
│   └── v1/                  # V1 Story Engine
│       ├── 1-gatekeeper/    # Act 1: Validation & identity
│       │   └── index.js
│       ├── 2-cartographer/  # Act 2: Isolated dependency resolution
│       │   └── index.js
│       ├── 3-detective/     # Act 3: Git provenance & owner fallback
│       │   └── index.js
│       └── index.js         # The 40-line Story Orchestrator
├── test/
│   └── resolver.test.js     # Unit tests for Acts 1, 2, and 3
├── package.json             # Package configuration & exports
├── README.md                # Project documentation & usage
└── STRUCTURE.md             # Codebase layout and architecture reference
```

---

## V1 Engine Breakdown

### Act 1: The Gatekeeper (`src/v1/1-gatekeeper/index.js`)
- Validates that the input specification is a non-empty string.
- Parses scoped vs unscoped names (e.g. `@org/pkg@1.0.0` vs `express`).
- Returns structured identity: `{ spec, name, version, scope, owner }`.

### Act 2: The Cartographer (`src/v1/2-cartographer/index.js`)
- Creates an ephemeral directory in `os.tmpdir()`.
- Uses `@npmcli/arborist` to compute the actual dependency graph without running lifecycle install scripts.
- Recursively traverses `tree.children` to extract every dependency node, version, and declared `repository` field.
- Guarantees 100% cleanup of the temporary sandbox via `finally`.

### Act 3: The Detective (`src/v1/3-detective/index.js`)
- Normalizes diverse Git repository formats (`git+https`, SCP-style `git@github.com:...`, SSH, and object literals) into canonical HTTPS URLs.
- Appends `.git` to form valid clone remotes.
- Converts scoped package names into safe sibling folder names (e.g. `@org/pkg` -> `org-pkg`).
- **Smart Owner Fallback:** When a monorepo or internal package omits the `"repository"` field, detects the primary GitHub organization/owner from sibling packages and synthesizes the fallback URL.
- Deduplicates distinct Git repositories so monorepo packages are represented once.

---

## Output Data Contract

```json
[
  {
    "name": "express",
    "version": "4.18.2",
    "repoUrl": "https://github.com/expressjs/express",
    "cloneUrl": "https://github.com/expressjs/express.git",
    "folder": "express",
    "isInferred": false
  }
]
```

---

## Decoupled Ecosystem Links

- 🌐 **Live Docs**: [keshavsoft.github.io/npm-repo-resolver](https://keshavsoft.github.io/npm-repo-resolver/)
- 📦 **npm Package**: [npmjs.com/package/npm-repo-resolver](https://www.npmjs.com/package/npm-repo-resolver)
- 🐙 **GitHub Repository**: [github.com/keshavsoft/npm-repo-resolver](https://github.com/keshavsoft/npm-repo-resolver)
- 📥 **Companion Cloner**: [`git-sibling-cloner`](https://www.npmjs.com/package/git-sibling-cloner)
- ⚡ **Parent Suite**: [`@keshavsoft/npm-source-explorer`](https://www.npmjs.com/package/@keshavsoft/npm-source-explorer)
- 📄 **License**: [MIT License](./LICENSE)

