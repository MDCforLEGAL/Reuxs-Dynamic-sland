/** In-app update check against the GitHub REST API (no secrets). */
import { APP_VERSION, releasesApiUrl, releasesPageUrl } from "./config";

export interface GitHubRelease {
  tag_name?: string;
  name?: string | null;
  html_url?: string;
  body?: string | null;
  published_at?: string | null;
  prerelease?: boolean;
  draft?: boolean;
}

export interface UpdateStatus {
  available: boolean;
  currentVersion: string;
  latestVersion: string | null;
  downloadUrl: string;
  publishedAt: string | null;
  checked: boolean;
  error: string | null;
}

export const UPDATE_IDLE: UpdateStatus = {
  available: false,
  currentVersion: APP_VERSION,
  latestVersion: null,
  downloadUrl: releasesPageUrl(),
  publishedAt: null,
  checked: false,
  error: null
};

export function normalizeVersion(version: string | null | undefined): string {
  return String(version ?? "").trim().replace(/^v/i, "");
}

/**
 * Compares two semver-ish versions.
 * Returns 1 when a > b, -1 when a < b and 0 when equal.
 */
export function compareVersions(a: string, b: string): number {
  const left = normalizeVersion(a).split(/[.+-]/);
  const right = normalizeVersion(b).split(/[.+-]/);
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const leftPart = left[index] ?? "0";
    const rightPart = right[index] ?? "0";
    const leftNumber = Number.parseInt(leftPart, 10);
    const rightNumber = Number.parseInt(rightPart, 10);
    if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
      if (leftNumber !== rightNumber) return leftNumber > rightNumber ? 1 : -1;
      continue;
    }
    const order = leftPart.localeCompare(rightPart);
    if (order !== 0) return order > 0 ? 1 : -1;
  }
  return 0;
}

export function isNewerVersion(latest: string, current: string = APP_VERSION): boolean {
  return compareVersions(latest, current) > 0;
}

export function parseRelease(release: GitHubRelease, current: string = APP_VERSION): UpdateStatus {
  const latestVersion = normalizeVersion(release.tag_name ?? release.name ?? null) || null;
  return {
    available: latestVersion ? isNewerVersion(latestVersion, current) : false,
    currentVersion: current,
    latestVersion,
    downloadUrl: release.html_url || releasesPageUrl(),
    publishedAt: release.published_at ?? null,
    checked: true,
    error: null
  };
}

/** Runs in both the Tauri webview and the browser preview; never throws. */
export async function checkForUpdate(current: string = APP_VERSION): Promise<UpdateStatus> {
  try {
    const response = await fetch(releasesApiUrl(), {
      headers: { Accept: "application/vnd.github+json" },
      cache: "no-store"
    });
    if (!response.ok) {
      return { ...UPDATE_IDLE, checked: true, error: `HTTP ${response.status}` };
    }
    const payload = (await response.json()) as GitHubRelease;
    return parseRelease(payload, current);
  } catch (error) {
    return {
      ...UPDATE_IDLE,
      checked: true,
      error: error instanceof Error ? error.message : "network error"
    };
  }
}
