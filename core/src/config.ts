/**
 * ReuXs — shared, platform independent configuration.
 *
 * The two values below are the ONLY ones the in-app updater needs.
 * They point at https://github.com/MDCforLEGAL/Reuxs-Dynamic-sland
 */
export const GITHUB_OWNER = "MDCforLEGAL";
export const GITHUB_REPO = "Reuxs-Dynamic-sland";

export const APP_NAME = "ReuXs";
export const APP_VERSION = "1.1.0";
export const APP_TAGLINE = "Material Capsule";

/** `https://api.github.com/repos/{owner}/{repo}/releases/latest` */
export function releasesApiUrl(owner: string = GITHUB_OWNER, repo: string = GITHUB_REPO): string {
  return `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
}

/** Human facing release page, opened in the default browser. */
export function releasesPageUrl(owner: string = GITHUB_OWNER, repo: string = GITHUB_REPO): string {
  return `https://github.com/${owner}/${repo}/releases/latest`;
}
