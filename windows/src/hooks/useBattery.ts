import { useEffect, useState } from "react";

interface BatteryLike {
  level: number;
  charging: boolean;
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
}

type NavigatorWithBattery = Navigator & { getBattery?: () => Promise<BatteryLike> };

export interface BatteryState {
  level: number | null;
  charging: boolean;
}

const UNKNOWN: BatteryState = { level: null, charging: false };

/**
 * Uses the Web Battery API where the webview exposes it. Windows WebView2 does
 * not implement it, so the UI degrades to an "AC" indicator instead of faking
 * a percentage.
 */
export function useBattery(): BatteryState {
  const [battery, setBattery] = useState<BatteryState>(UNKNOWN);

  useEffect(() => {
    const nav = navigator as NavigatorWithBattery;
    if (typeof nav.getBattery !== "function") return;

    let manager: BatteryLike | null = null;
    let cancelled = false;

    const sync = () => {
      if (!manager || cancelled) return;
      setBattery({ level: Math.round(manager.level * 100), charging: manager.charging });
    };

    nav
      .getBattery()
      .then((next) => {
        if (cancelled) return;
        manager = next;
        sync();
        next.addEventListener("levelchange", sync);
        next.addEventListener("chargingchange", sync);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      manager?.removeEventListener("levelchange", sync);
      manager?.removeEventListener("chargingchange", sync);
    };
  }, []);

  return battery;
}
