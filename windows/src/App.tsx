import { getCurrentWindow } from "@tauri-apps/api/window";
import { CapsuleApp } from "./CapsuleApp";
import { SettingsApp } from "./SettingsApp";
import { isTauri } from "./lib/os";

/** Which window is rendering: the capsule (`main`) or the control panel. */
export function currentWindowLabel(): string {
  if (!isTauri()) {
    return new URLSearchParams(window.location.search).get("view") === "settings"
      ? "settings"
      : "main";
  }
  try {
    return getCurrentWindow().label;
  } catch {
    return "main";
  }
}

export function isSettingsWindow(): boolean {
  return currentWindowLabel() === "settings";
}

export default function App() {
  return isSettingsWindow() ? <SettingsApp /> : <CapsuleApp />;
}
