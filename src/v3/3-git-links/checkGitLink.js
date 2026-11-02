import {
  normalizeGitUrl,
  toCloneUrl,
  toSafeFolderName
} from "./normalizeGitUrl.js";
import { manifestCache } from "../2-npm-names/collectNpmNames.js";

export async function fetchPackageManifest(packageName) {
  if (manifestCache && manifestCache.has(packageName)) {
    return manifestCache.get(packageName);
  }

  try {
    const encoded = encodeURIComponent(packageName);
    const response = await fetch(`https://registry.npmjs.org/${encoded}`, {
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      return { name: packageName, version: null, repository: null };
    }

    const data = await response.json();
    const latestVersion = data["dist-tags"]?.latest;
    const versionData = latestVersion ? data.versions?.[latestVersion] : null;

    return {
      name: packageName,
      version: latestVersion || null,
      repository: data.repository || versionData?.repository || null
    };
  } catch {
    return { name: packageName, version: null, repository: null };
  }
}

export async function checkGitLink(packageName, options = {}) {
  const { defaultOwner = null, manifest = null } = options;
  const pkgData = manifest || (await fetchPackageManifest(packageName));

  let repoUrl = normalizeGitUrl(pkgData.repository);
  let isInferred = false;

  // Fallback inference if repository link is not present
  if (!repoUrl && defaultOwner) {
    const cleanFolder = toSafeFolderName(packageName);
    repoUrl = `https://github.com/${defaultOwner}/${cleanFolder}`;
    isInferred = true;
  }

  const hasGitLink = Boolean(repoUrl);

  return {
    name: packageName,
    version: pkgData.version || null,
    repoUrl: repoUrl || null,
    cloneUrl: toCloneUrl(repoUrl),
    folder: toSafeFolderName(packageName),
    hasGitLink,
    isInferred
  };
}

export default checkGitLink;

