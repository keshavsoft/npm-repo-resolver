import { checkGitLink, fetchPackageManifest } from "./checkGitLink.js";
import { normalizeGitUrl, extractGitHubOwner } from "./normalizeGitUrl.js";

export async function resolveGitLinks(npmNames, options = {}) {
  if (!Array.isArray(npmNames)) return [];

  let detectedOwner = options.defaultOwner || null;

  // 1. Preload manifests concurrently if needed
  const manifests = await Promise.all(
    npmNames.map((name) => fetchPackageManifest(name))
  );

  // 2. Detect primary owner from declared repositories if not already known
  if (!detectedOwner) {
    for (const m of manifests) {
      const url = normalizeGitUrl(m.repository);
      if (url) {
        detectedOwner = extractGitHubOwner(url);
        if (detectedOwner) break;
      }
    }
  }

  // 3. Check git links for all packages
  const results = await Promise.all(
    npmNames.map((name, i) =>
      checkGitLink(name, {
        defaultOwner: detectedOwner,
        manifest: manifests[i]
      })
    )
  );

  // 4. Deduplicate repositories
  const unique = new Map();
  for (const item of results) {
    if (!item.hasGitLink || !item.repoUrl) continue;

    if (!unique.has(item.repoUrl)) {
      unique.set(item.repoUrl, item);
    }
  }

  return Array.from(unique.values());
}

export default resolveGitLinks;

