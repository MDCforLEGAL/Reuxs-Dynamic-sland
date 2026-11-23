import { invoke } from "@tauri-apps/api/core";

/** Opens `url` in the user's default browser (Tauri) or a new tab (browser dev). */
export async function openExternal(url: string): Promise<void> {
  try {
    await invoke("open_external_url", { url });
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}
