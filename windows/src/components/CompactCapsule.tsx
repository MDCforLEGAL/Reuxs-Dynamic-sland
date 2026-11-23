import { motion } from "framer-motion";
import { formatDuration, type UpdateStatus } from "@core";
import type { BatteryState } from "../hooks/useBattery";
import { BatteryIcon, CapsuleGlyph, ChevronDownIcon, PauseIcon, PlayIcon } from "./icons";

interface CompactCapsuleProps {
  remainingMs: number;
  running: boolean;
  battery: BatteryState;
  update: UpdateStatus;
  onToggleTimer: () => void;
  onExpand: () => void;
}

export function CompactCapsule({
  remainingMs,
  running,
  battery,
  update,
  onToggleTimer,
  onExpand
}: CompactCapsuleProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.14 }}
      className="flex h-11 w-full items-center gap-2 pl-2.5 pr-1.5"
    >
      <div
        data-tauri-drag-region
        onClick={onExpand}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2"
      >
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-crimson-950/90 ring-1 ring-crimson-500/40">
          <CapsuleGlyph className="h-3.5 w-3.5 text-crimson-400" />
        </span>
        <span className="flex min-w-0 flex-col leading-none">
          <span className="truncate text-[12.5px] font-semibold tracking-[0.02em] text-ink-50">
            ReuXs
          </span>
          <span className="mt-0.5 text-[8.5px] uppercase tracking-[0.22em] text-ink-500">
            Material Capsule
          </span>
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onToggleTimer}
          title={running ? "Zamanlayıcıyı duraklat" : "Zamanlayıcıyı başlat"}
          className="flex h-7 items-center gap-1 rounded-full border border-crimson-500/25 bg-black/40 px-2 font-mono text-[11px] tabular-nums text-zinc-200 transition-colors hover:border-crimson-500/50 hover:text-white"
        >
          {running ? (
            <PauseIcon className="h-2.5 w-2.5 text-crimson-400" />
          ) : (
            <PlayIcon className="h-2.5 w-2.5 text-crimson-400" />
          )}
          {formatDuration(remainingMs)}
        </button>

        <span className="flex h-7 items-center gap-1 rounded-full border border-white/5 bg-black/30 px-2 text-[10.5px] text-ink-400">
          <BatteryIcon className="h-3 w-3 text-crimson-400/80" />
          {battery.level === null ? "AC" : `${battery.level}%`}
        </span>

        {update.available ? (
          <span
            title={`Güncelleme mevcut: v${update.latestVersion}`}
            className="h-1.5 w-1.5 rounded-full bg-crimson-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]"
          />
        ) : null}

        <button
          type="button"
          onClick={onExpand}
          aria-label="Kapsülü genişlet"
          className="grid h-7 w-7 place-items-center rounded-full text-ink-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ChevronDownIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
