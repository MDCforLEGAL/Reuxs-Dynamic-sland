import { useCallback, useEffect, useState } from "react";
import { emit, listen } from "@tauri-apps/api/event";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  normalizeSettings,
  saveSettings,
  type ReuxsSettings
} from "@core";
import { isTauri } from "../lib/os";

/** Cross-window notification: the control panel owns the writes. */
const SETTINGS_EVENT = "reuxs://settings-changed";

function publish(next: ReuxsSettings) {
  saveSettings(next);
  if (isTauri()) {
    void emit(SETTINGS_EVENT, next).catch(() => undefined);
  }
}

export interface SettingsApi {
  settings: ReuxsSettings;
  update: (patch: Partial<ReuxsSettings>) => void;
  reset: () => void;
}

export function useSettings(): SettingsApi {
  const [settings, setSettings] = useState<ReuxsSettings>(() => loadSettings());

  useEffect(() => {
    const reload = () => setSettings(loadSettings());
    window.addEventListener("storage", reload);

    let unlisten: (() => void) | undefined;
    if (isTauri()) {
      void listen(SETTINGS_EVENT, reload)
        .then((dispose) => {
          unlisten = dispose;
        })
        .catch(() => undefined);
    }

    return () => {
      window.removeEventListener("storage", reload);
      unlisten?.();
    };
  }, []);

  const update = useCallback((patch: Partial<ReuxsSettings>) => {
    setSettings((previous) => {
      const next = normalizeSettings({ ...previous, ...patch });
      publish(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setSettings(() => {
      const next = normalizeSettings(DEFAULT_SETTINGS);
      publish(next);
      return next;
    });
  }, []);

  return { settings, update, reset };
}
