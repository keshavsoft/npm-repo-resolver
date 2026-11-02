import { validatePackage } from "./1-guard/index.js";
import { collectNpmNames } from "npm-repo-resolver-names";
import { resolveGitLinks } from "npm-repo-resolver-git";

/**
 * v4 Engine - Composed from Decoupled Micro-Repos:
 *   1-guard                 : Local input validation
 *   npm-repo-resolver-names : Standalone dependency explorer repo
 *   npm-repo-resolver-git   : Standalone Git link discoverer repo
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

export { validatePackage, collectNpmNames, resolveGitLinks };

export default resolveDependencyRepos;
