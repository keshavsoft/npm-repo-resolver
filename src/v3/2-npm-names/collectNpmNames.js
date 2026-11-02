import Arborist from "@npmcli/arborist";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";

// Shared in-memory cache of package manifests discovered during tree resolution
export const manifestCache = new Map();

export async function collectNpmNames(packageSpec, options = {}) {
  const onProgress = typeof options.onProgress === "function" ? options.onProgress : () => {};
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "npm-repo-resolver-"));
  const workspacePath = path.join(tempDir, "workspace");

  try {
    await fs.mkdir(workspacePath, { recursive: true });

    const arborist = new Arborist({
      path: workspacePath,
      audit: false,
      fund: false,
      progress: false,
      loglevel: "silent"
    });

    onProgress({ stage: "reifying", packageSpec });
    try {
      await arborist.reify({
        add: [packageSpec],
        audit: false,
        fund: false,
        progress: false,
        save: false
      });
    } catch (err) {
      throw new Error(`Package "${packageSpec}" could not be resolved on npm: ${err.message}`);
    }

    const tree = await arborist.loadActual();
    const namesSet = new Set();
    const visited = new Set();

    function traverse(node) {
      if (!node) return;
      const key = node.location || `${node.name}@${node.version}`;
      if (visited.has(key)) return;
      visited.add(key);

      const pkgName = node.package?.name ?? node.name;
      const pkgVersion = node.package?.version ?? null;
      const repository = node.package?.repository ?? null;

      if (pkgName) {
        namesSet.add(pkgName);
        manifestCache.set(pkgName, {
          name: pkgName,
          version: pkgVersion,
          repository
        });
      }

      for (const edge of node.edgesOut.values()) {
        if (edge.to) traverse(edge.to);
      }
    }

    for (const child of tree.children.values()) {
      traverse(child);
    }

    const names = Array.from(namesSet);
    onProgress({ stage: "names-collected", count: names.length, names });
    return names;
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

export default collectNpmNames;

