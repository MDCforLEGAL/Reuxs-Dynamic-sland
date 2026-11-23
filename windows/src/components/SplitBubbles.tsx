import { motion } from "framer-motion";
import { CAPSULE_LAYOUT, CAPSULE_SPRING, formatClock, formatDuration, theme } from "@core";
import type { BatteryState } from "../hooks/useBattery";
import type { TimerApi } from "../hooks/useTimer";
import { BatteryIcon, CapsuleGlyph, ChevronDownIcon, PauseIcon, PlayIcon, ResetIcon } from "./icons";

interface SplitBubblesProps {
  clock: Date;
  battery: BatteryState;
  timer: TimerApi;
  onMerge: () => void;
}

const bubbleStyle = {
  background: theme.gradients.capsule,
  borderColor: theme.colors.border,
  boxShadow: theme.shadows.compact
} as const;

export function SplitBubbles({ clock, battery, timer, onMerge }: SplitBubblesProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.96 }}
      transition={CAPSULE_SPRING}
      className="flex items-start gap-2"
    >
      <motion.div
        layout
        style={{ ...bubbleStyle, width: CAPSULE_LAYOUT.splitBubbleWidth }}
        className="flex h-[62px] items-center gap-2 rounded-[22px] border px-3"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-crimson-950/90 ring-1 ring-crimson-500/40">
          <CapsuleGlyph className="h-4 w-4 text-crimson-400" />
        </span>
        <div className="flex min-w-0 flex-col leading-none">
          <span className="font-mono text-[13px] tabular-nums text-ink-50">{formatClock(clock)}</span>
          <span className="mt-1 flex items-center gap-1 text-[9px] uppercase tracking-[0.14em] text-ink-500">
            <BatteryIcon className="h-2.5 w-2.5 text-crimson-400/80" />
            {battery.level === null ? "AC" : `${battery.level}%`}
          </span>
        </div>
        <button
          type="button"
          onClick={onMerge}
          aria-label="Baloncukları birleştir"
          className="ml-auto grid h-6 w-6 place-items-center rounded-full text-ink-500 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ChevronDownIcon className="h-3 w-3 rotate-90" />
        </button>
      </motion.div>

      <motion.div
        layout
        style={{ ...bubbleStyle, width: CAPSULE_LAYOUT.splitBubbleWidth }}
        className="flex h-[62px] items-center gap-2 rounded-[22px] border px-3"
      >
        <div className="flex min-w-0 flex-col leading-none">
          <span className="font-mono text-[17px] tabular-nums text-ink-50">
            {formatDuration(timer.remainingMs)}
          </span>
          <span className="mt-1 text-[9px] uppercase tracking-[0.14em] text-ink-500">
            {timer.running ? "çalışıyor" : "zamanlayıcı"}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={timer.toggle}
            aria-label={timer.running ? "Duraklat" : "Başlat"}
            className="grid h-7 w-7 place-items-center rounded-full bg-crimson-500 text-black transition-transform duration-150 hover:bg-crimson-400 active:scale-95"
          >
            {timer.running ? <PauseIcon className="h-3 w-3" /> : <PlayIcon className="h-3 w-3" />}
          </button>
          <button
            type="button"
            onClick={timer.reset}
            aria-label="Sıfırla"
            className="grid h-7 w-7 place-items-center rounded-full border border-white/10 text-ink-400 transition-colors hover:border-crimson-500/40 hover:text-white"
          >
            <ResetIcon className="h-3 w-3" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
