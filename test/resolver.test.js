import test from "node:test";
import assert from "node:assert/strict";
import {
  parsePackageSpec,
  validatePackage,
  normalizeRepoUrl,
  toCloneUrl,
  extractGitHubOwner,
  toSafeFolderName,
  resolveRepositories
} from "../src/index.js";

test("Gatekeeper: parses package spec, name, version, and owner", async () => {
  const parsed = parsePackageSpec("@keshavsoft/json-renderers@1.2.0");
  assert.equal(parsed.name, "@keshavsoft/json-renderers");
  assert.equal(parsed.version, "1.2.0");
  assert.equal(parsed.owner, "keshavsoft");

  const validated = await validatePackage("express");
  assert.equal(validated.name, "express");
  assert.equal(validated.version, null);
  assert.equal(validated.owner, null);
});

test("Gatekeeper: rejects empty or invalid package specs", () => {
  assert.throws(() => parsePackageSpec(""), /Invalid target/);
  assert.throws(() => parsePackageSpec(null), /Invalid target/);
});

test("Detective: normalizes repository URL variations into canonical HTTPS", () => {
  assert.equal(
    normalizeRepoUrl("git+https://github.com/expressjs/express.git"),
    "https://github.com/expressjs/express"
  );
  assert.equal(
    normalizeRepoUrl("git@github.com:facebook/react.git"),
    "https://github.com/facebook/react"
  );
  assert.equal(
    normalizeRepoUrl("git://github.com/lodash/lodash.git"),
    "https://github.com/lodash/lodash"
  );
  assert.equal(
    normalizeRepoUrl({ type: "git", url: "https://github.com/user/repo" }),
    "https://github.com/user/repo"
  );
  assert.equal(normalizeRepoUrl(null), null);
});

test("Detective: creates canonical clone URLs", () => {
  assert.equal(
    toCloneUrl("https://github.com/expressjs/express"),
    "https://github.com/expressjs/express.git"
  );
  assert.equal(toCloneUrl(null), null);
});

test("Detective: converts scoped package names into safe folder names", () => {
  assert.equal(toSafeFolderName("@keshavsoft/npm-repo-resolver"), "keshavsoft-npm-repo-resolver");
  assert.equal(toSafeFolderName("express"), "express");
});

test("Detective: infers missing repositories and deduplicates", () => {
  const mockDeps = [
    { name: "parent-pkg", repository: "https://github.com/myorg/parent-pkg.git" },
    { name: "child-pkg", repository: null },
    { name: "duplicate-ref", repository: "https://github.com/myorg/parent-pkg.git" }
  ];

  const repos = resolveRepositories(mockDeps);
  assert.equal(repos.length, 2);

  const parent = repos.find((r) => r.name === "parent-pkg");
  assert.ok(parent);
  assert.equal(parent.repoUrl, "https://github.com/myorg/parent-pkg");
  assert.equal(parent.cloneUrl, "https://github.com/myorg/parent-pkg.git");
  assert.equal(parent.isInferred, false);

  const child = repos.find((r) => r.name === "child-pkg");
  assert.ok(child);
  assert.equal(child.repoUrl, "https://github.com/myorg/child-pkg");
  assert.equal(child.isInferred, true);
});
