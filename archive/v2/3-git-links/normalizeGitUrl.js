export function normalizeGitUrl(repository) {
  if (!repository) return null;
  const raw = typeof repository === "string" ? repository.trim() : repository.url?.trim();
  if (!raw) return null;

  let url = raw.replace(/^git\+/, "");
  if (url.startsWith("git://")) {
    url = `https://${url.slice(6)}`;
  } else if (url.startsWith("ssh://git@github.com/")) {
    url = `https://github.com/${url.slice("ssh://git@github.com/".length)}`;
  } else if (url.startsWith("git@github.com:")) {
    url = `https://github.com/${url.slice("git@github.com:".length)}`;
  }

  url = url.replace(/\.git\/?$/, "").replace(/\/+$/, "");
  return url || null;
}

export function toCloneUrl(url) {
  if (!url) return null;
  if (/^https:\/\/(github\.com|gitlab\.com|bitbucket\.org)\//i.test(url)) {
    return `${url}.git`;
  }
  return url;
}

export function extractGitHubOwner(url) {
  if (!url || typeof url !== "string") return null;
  const match = url.match(/^https?:\/\/(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)(?:\/|$)/i);
  return match ? match[1] : null;
}

export function toSafeFolderName(packageName) {
  if (!packageName || typeof packageName !== "string") {
    return "unnamed-package";
  }

  return packageName
    .replace(/^@/, "")
    .replace(/[\\/]/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "-");
}

