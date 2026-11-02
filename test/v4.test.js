import test from "node:test";
import assert from "node:assert/strict";

import {
  validatePackage,
  collectNpmNames,
  resolveGitLinks,
  resolveDependencyRepos,
  resolveNpmNames,
  resolveGitUrls,
  resolveRepoMap
} from "../src/v4/index.js";

test("v4 Engine: validates incoming package spec", () => {
  const parsed = validatePackage("@keshavsoft/json-renderers@1.2.0");
  assert.equal(parsed.name, "@keshavsoft/json-renderers");
  assert.equal(parsed.version, "1.2.0");
  assert.equal(parsed.owner, "keshavsoft");
  assert.equal(parsed.scope, "keshavsoft");

  assert.throws(() => validatePackage(""), /Invalid target/);
});

test("v4 Engine: uses npm-repo-resolver-names to collect npm names", async () => {
  const names = await collectNpmNames("is-number");
  assert.ok(Array.isArray(names));
  assert.ok(names.includes("is-number"));
});

test("v4 Engine: uses npm-repo-resolver-git to resolve git links", async () => {
  const repos = await resolveGitLinks(["is-number"]);
  assert.ok(Array.isArray(repos));
  assert.ok(repos.length > 0);
  assert.equal(repos[0].name, "is-number");
  assert.ok(repos[0].repoUrl.includes("github.com"));
});

test("v4 Engine Pipeline: resolveDependencyRepos, resolveNpmNames, resolveGitUrls", async () => {
  const npmNames = await resolveNpmNames("is-number");
  assert.ok(Array.isArray(npmNames));
  assert.ok(npmNames.includes("is-number"));

  const repos = await resolveDependencyRepos("is-number");
  assert.ok(Array.isArray(repos));
  assert.ok(repos.length > 0);
  assert.ok(repos[0].repoUrl.includes("github.com"));

  const urls = await resolveGitUrls("is-number");
  assert.ok(Array.isArray(urls));
  assert.ok(urls[0].startsWith("https://github.com/"));

  const map = await resolveRepoMap("is-number");
  assert.equal(typeof map, "object");
  assert.ok(map["is-number"]);
});
