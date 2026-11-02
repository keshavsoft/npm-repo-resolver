import { collectNpmNames } from "npm-repo-resolver-names";
import { resolveGitLinks } from "npm-repo-resolver-git";

/**
 * npm-repo-resolver
 * -------------------------------------------------------------
 * Takes an npm package spec and discovers authentic Git repository
 * remotes for all dependencies down the tree.
 *
 * The 2-Step Story:
 *   Step 1: npm-repo-resolver-names -> Recursively collects all npm package names
 *   Step 2: npm-repo-resolver-git   -> Resolves authentic Git links for those names
 * -------------------------------------------------------------
 */
export async function resolveDependencyRepos(packageSpec, options = {}) {
  const npmNames = await collectNpmNames(packageSpec, options);
  const repositories = await resolveGitLinks(npmNames, options);
  return repositories;
}

export default resolveDependencyRepos;
