import { motion } from "framer-motion";
import { APP_TAGLINE, APP_VERSION, formatClock } from "@core";
import type { BatteryState } from "../hooks/useBattery";
import type { TimerApi } from "../hooks/useTimer";
import type { UpdateApi } from "../hooks/useUpdate";
import { QuickActions } from "./QuickActions";
import { StatusBadge } from "./StatusBadge";
import { TimerPanel } from "./TimerPanel";
import { UpdateBadge } from "./UpdateBadge";
import { BatteryIcon, CapsuleGlyph, ChevronDownIcon } from "./icons";

interface ExpandedCapsuleProps {
  clock: Date;
  battery: BatteryState;
  timer: TimerApi;
  update: UpdateApi;
  onCollapse: () => void;
  onSplit: () => void;
  onFocus: () => void;
}

export function ExpandedCapsule({
  clock,
  battery,
  timer,
  update,
  onCollapse,
  onSplit,
  onFocus
}: ExpandedCapsuleProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, delay: 0.04 }}
      className="flex w-full flex-col"
    >
      <header data-tauri-drag-region className="flex items-center gap-2 px-3.5 pb-2.5 pt-3">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-crimson-950/90 ring-1 ring-crimson-500/40">
          <CapsuleGlyph className="h-4 w-4 text-crimson-400" />
        </span>
        <div data-tauri-drag-region className="flex flex-col leading-none">
          <span className="text-[13px] font-semibold tracking-[0.02em] text-ink-50">ReuXs</span>
          <span className="mt-0.5 text-[8.5px] uppercase tracking-[0.2em] text-ink-500">
            {APP_TAGLINE} · v{APP_VERSION}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="font-mono text-[13px] tabular-nums text-ink-50">
            {formatClock(clock)}
          </span>
          <button
            type="button"
            onClick={onCollapse}
            aria-label="Kapsülü daralt"
            className="grid h-7 w-7 place-items-center rounded-full text-ink-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <ChevronDownIcon className="h-3.5 w-3.5 rotate-180" />
          </button>
        </div>
      </header>

      <div className="flex items-center gap-1.5 px-3.5 pb-2.5">
        <StatusBadge />
        <span className="inline-flex items-center gap-1 rounded-full border border-white/5 bg-black/30 px-2 py-1 text-[9.5px] text-ink-400">
          <BatteryIcon className="h-3 w-3 text-crimson-400/80" />
          {battery.level === null ? "AC gücü" : `${battery.level}%${battery.charging ? " · şarj" : ""}`}
        </span>
        {update.status.error ? (
          <span className="ml-auto text-[9px] text-ink-500">güncelleme denetlenemedi</span>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5 px-3 pb-3">
        <TimerPanel timer={timer} />
        <QuickActions
          checking={update.checking}
          onSplit={onSplit}
          onFocus={onFocus}
          onCheckUpdates={() => void update.refresh()}
        />
        {update.status.available ? <UpdateBadge status={update.status} /> : null}
      </div>
    </motion.div>
  );
}
