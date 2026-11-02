import test from "node:test";
import assert from "node:assert/strict";

import { validatePackage } from "../src/v2/1-guard/index.js";
import { collectNpmNames } from "../src/v2/2-npm-names/index.js";
import {
  checkGitLink,
  resolveGitLinks,
  normalizeGitUrl,
  toCloneUrl,
  extractGitHubOwner,
  toSafeFolderName
} from "../src/v2/3-git-links/index.js";
import {
  resolveDependencyRepos,
  resolveNpmNames,
  resolveGitUrls,
  resolveRepoMap
} from "../src/v2/index.js";

test("Step 1 (1-guard): validates and parses incoming package spec", () => {
  const parsed = validatePackage("@keshavsoft/json-renderers@1.2.0");
  assert.equal(parsed.name, "@keshavsoft/json-renderers");
  assert.equal(parsed.version, "1.2.0");
  assert.equal(parsed.owner, "keshavsoft");
  assert.equal(parsed.scope, "keshavsoft");

  const simple = validatePackage("express");
  assert.equal(simple.name, "express");
  assert.equal(simple.version, null);
  assert.equal(simple.owner, null);

  assert.throws(() => validatePackage(""), /Invalid target/);
  assert.throws(() => validatePackage(null), /Invalid target/);
});

test("Step 3 (3-git-links): URL utilities work correctly", () => {
  assert.equal(
    normalizeGitUrl("git+https://github.com/expressjs/express.git"),
    "https://github.com/expressjs/express"
  );
  assert.equal(
    normalizeGitUrl("git@github.com:facebook/react.git"),
    "https://github.com/facebook/react"
  );
  assert.equal(
    toCloneUrl("https://github.com/expressjs/express"),
    "https://github.com/expressjs/express.git"
  );
  assert.equal(extractGitHubOwner("https://github.com/keshavsoft/spec-repo"), "keshavsoft");
  assert.equal(toSafeFolderName("@keshavsoft/json-to-dom"), "keshavsoft-json-to-dom");
});

test("Step 3 (3-git-links): checks git links given array of package names with manifest mock", async () => {
  const single = await checkGitLink("pkg-inferred", {
    defaultOwner: "myowner",
    manifest: { name: "pkg-inferred", repository: null }
  });
  assert.equal(single.hasGitLink, true);
  assert.equal(single.isInferred, true);
  assert.equal(single.repoUrl, "https://github.com/myowner/pkg-inferred");
  assert.equal(single.cloneUrl, "https://github.com/myowner/pkg-inferred.git");

  const declared = await checkGitLink("pkg-declared", {
    manifest: {
      name: "pkg-declared",
      repository: "https://github.com/org/pkg-declared.git"
    }
  });
  assert.equal(declared.hasGitLink, true);
  assert.equal(declared.isInferred, false);
  assert.equal(declared.repoUrl, "https://github.com/org/pkg-declared");
});

test("Step 2 (2-npm-names): returns array of strings for dependencies", async () => {
  // Use a small leaf package to test recursion
  const names = await collectNpmNames("is-number");
  assert.ok(Array.isArray(names));
  assert.ok(names.includes("is-number"));
  for (const name of names) {
    assert.equal(typeof name, "string");
  }
});

test("Pipeline Integration: resolveDependencyRepos, resolveNpmNames, resolveGitUrls", async () => {
  const npmNames = await resolveNpmNames("is-number");
  assert.ok(Array.isArray(npmNames));
  assert.ok(npmNames.includes("is-number"));

  const repos = await resolveDependencyRepos("is-number");
  assert.ok(Array.isArray(repos));
  assert.ok(repos.length > 0);
  assert.ok(repos[0].repoUrl.includes("github.com"));

  const urls = await resolveGitUrls("is-number");
  assert.ok(Array.isArray(urls));
  assert.equal(typeof urls[0], "string");
  assert.ok(urls[0].startsWith("https://github.com/"));

  const map = await resolveRepoMap("is-number");
  assert.equal(typeof map, "object");
  assert.ok(map["is-number"]);
});
