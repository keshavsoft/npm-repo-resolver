/**
 * ============================================================================
 * npm-repo-resolver :: V1 Engine
 * ----------------------------------------------------------------------------
 * The 3-Act Story:
 *   Act 1: The Gatekeeper   (1-gatekeeper)   - Validate package & check identity
 *   Act 2: The Cartographer (2-cartographer) - Build recursive dependency tree
 *   Act 3: The Detective    (3-detective)    - Map authentic Git repos & fallback
 * ============================================================================
 */

import { validatePackage, parsePackageSpec } from "./1-gatekeeper/index.js";
import { buildDependencyTree } from "./2-cartographer/index.js";
import {
  resolveRepositories,
  normalizeRepoUrl,
  toCloneUrl,
  extractGitHubOwner,
  toSafeFolderName
} from "./3-detective/index.js";

/**
 * Resolves all authentic upstream Git repositories for an npm package and its dependencies.
 *
 * @param {string} packageSpec - e.g. "express", "react@18.2.0", "json-renderers"
 * @param {object} [options]
 * @param {function} [options.onProgress] - Optional progress event callback
 * @returns {Promise<Array<{ name: string, version: string|null, repoUrl: string, cloneUrl: string, folder: string, isInferred: boolean }>>}
 */
export async function resolveDependencyRepos(packageSpec, options = {}) {
  const onProgress = typeof options.onProgress === "function" ? options.onProgress : () => {};

  // Act 1: The Gatekeeper - validate package identity
  const target = await validatePackage(packageSpec);
  onProgress({ act: 1, stage: "validated", target });

  // Act 2: The Cartographer - build recursive dependency tree in isolation
  onProgress({ act: 2, stage: "resolving", packageSpec: target.spec });
  const tree = await buildDependencyTree(target.spec);
  onProgress({ act: 2, stage: "tree-mapped", count: tree.length });

  // Act 3: The Detective - trace Git provenance, fallback and deduplicate
  const repositories = resolveRepositories(tree, target.owner);
  onProgress({
    act: 3,
    stage: "resolved",
    totalPackages: tree.length,
    uniqueCount: repositories.length,
    repositories
  });

  return repositories;
}

export {
  validatePackage,
  parsePackageSpec,
  buildDependencyTree,
  resolveRepositories,
  normalizeRepoUrl,
  toCloneUrl,
  extractGitHubOwner,
  toSafeFolderName
};

export default resolveDependencyRepos;

