import test from "node:test";
import assert from "node:assert/strict";

import { resolveDependencyRepos } from "../src/v4/index.js";
import defaultResolver from "../src/index.js";

test("npm-repo-resolver: root export matches v4 engine", () => {
  assert.equal(typeof resolveDependencyRepos, "function");
  assert.equal(typeof defaultResolver, "function");
  assert.equal(resolveDependencyRepos, defaultResolver);
});

test("npm-repo-resolver: resolves authentic Git repositories end-to-end", async () => {
  const repos = await resolveDependencyRepos("is-number");
  assert.ok(Array.isArray(repos));
  assert.ok(repos.length > 0);
  assert.equal(repos[0].name, "is-number");
  assert.ok(repos[0].repoUrl.includes("github.com"));
  assert.ok(repos[0].cloneUrl.endsWith(".git"));
});
