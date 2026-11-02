import { validatePackage } from "./1-guard/index.js";
import { collectNpmNames } from "./2-npm-names/index.js";
import { resolveGitLinks } from "./3-git-links/index.js";

/**
 * 3-Step Pipeline:
 *   1-guard     : Validate incoming package spec
 *   2-npm-names : Recursively collect all npm package names (Array of strings)
 *   3-git-links : Check if Git links are present for each npm package
 */
export async function resolveDependencyRepos(packageSpec, options = {}) {
  const target = validatePackage(packageSpec);
  const npmNames = await collectNpmNames(target.spec, options);
  const gitLinks = await resolveGitLinks(npmNames, {
    defaultOwner: target.owner,
    ...options
  });
  return gitLinks;
}

export async function resolveNpmNames(packageSpec, options = {}) {
  const target = validatePackage(packageSpec);
  return collectNpmNames(target.spec, options);
}

export async function resolveGitUrls(packageSpec, options = {}) {
  const gitLinks = await resolveDependencyRepos(packageSpec, options);
  return gitLinks.map((r) => r.repoUrl);
}

export async function resolveCloneUrls(packageSpec, options = {}) {
  const gitLinks = await resolveDependencyRepos(packageSpec, options);
  return gitLinks.map((r) => r.cloneUrl);
}

export async function resolveRepoMap(packageSpec, options = {}) {
  const gitLinks = await resolveDependencyRepos(packageSpec, options);
  return Object.fromEntries(gitLinks.map((r) => [r.name, r.repoUrl]));
}

export * from "./1-guard/index.js";
export * from "./2-npm-names/index.js";
export * from "./3-git-links/index.js";

export default resolveDependencyRepos;

