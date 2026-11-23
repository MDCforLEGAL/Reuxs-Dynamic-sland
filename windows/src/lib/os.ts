import { invoke } from "@tauri-apps/api/core";

/** True inside the Tauri webview (false in the plain browser preview). */
export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/** `invoke` that never throws: browser preview and denied commands degrade. */
export async function invokeSafe<T>(
  command: string,
  args?: Record<string, unknown>
): Promise<T | null> {
  if (!isTauri()) return null;
  try {
    return await invoke<T>(command, args);
  } catch {
    return null;
  }
}

/** Opens `url` in the user's default browser (Tauri) or a new tab (browser dev). */
export async function openExternal(url: string): Promise<void> {
  const handled = await invokeSafe("open_external_url", { url });
  if (handled === null && !isTauri()) {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

/** Focuses (or opens) the independent control panel window. */
export async function openSettings(): Promise<void> {
  await invokeSafe("open_settings");
}

/** Shows / hides the capsule window without stopping the app. */
export async function setCapsuleVisible(visible: boolean): Promise<void> {
  await invokeSafe("set_capsule_visible", { visible });
}

/** Starts / stops ReuXs with Windows (HKCU Run key). */
export async function setAutostart(enabled: boolean): Promise<void> {
  await invokeSafe("set_autostart", { enabled });
}
