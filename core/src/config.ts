/**
 * ReuXs — shared, platform independent configuration.
 *
 * TODO(release): replace the two placeholders below with your GitHub account
 * and repository name. They are the ONLY values the in-app updater needs.
 *   GITHUB_OWNER = "your-username"
 *   GITHUB_REPO  = "your-repo"
 */
export const GITHUB_OWNER = "https://github.com/MDCforLEGAL/";
export const GITHUB_REPO = "https://github.com/MDCforLEGAL/Reuxs-Dynamic-sland/";

export const APP_NAME = "ReuXs";
export const APP_VERSION = "1.0.0";
export const APP_TAGLINE = "Material Capsule";

/** `https://api.github.com/repos/<OWNER>/<REPO>/releases/latest` */
export function releasesApiUrl(owner: string = GITHUB_OWNER, repo: string = GITHUB_REPO): string {
  return `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
}

/** Human facing release page, opened in the default browser. */
export function releasesPageUrl(owner: string = GITHUB_OWNER, repo: string = GITHUB_REPO): string {
  return `https://github.com/${owner}/${repo}/releases/latest`;
}
