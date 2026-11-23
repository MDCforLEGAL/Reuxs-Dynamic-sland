import { motion } from "framer-motion";
import { formatDuration, timerProgressPresets } from "../lib/presets";
import type { TimerApi } from "../hooks/useTimer";
import { PauseIcon, PlayIcon, ResetIcon } from "./icons";

interface TimerPanelProps {
  timer: TimerApi;
}

export function TimerPanel({ timer }: TimerPanelProps) {
  const { remainingMs, running, progress, toggle, reset, setDuration } = timer;

  return (
    <div className="rounded-[18px] border border-crimson-500/20 bg-black/45 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[9.5px] uppercase tracking-[0.22em] text-ink-500">
          Hızlı zamanlayıcı
        </span>
        <span className="font-mono text-[10px] tabular-nums text-ink-500">
          {Math.round(progress * 100)}%
        </span>
      </div>

      <div className="mt-1.5 flex items-end gap-2">
        <span className="font-mono text-[32px] leading-none tracking-tight text-ink-50 tabular-nums">
          {formatDuration(remainingMs)}
        </span>
        <span
          className={`mb-0.5 text-[9.5px] uppercase tracking-[0.18em] ${
            running ? "text-crimson-400" : "text-ink-500"
          }`}
        >
          {running ? "çalışıyor" : "beklemede"}
        </span>
      </div>

      <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          animate={{ width: `${Math.round(progress * 100)}%` }}
          transition={{ type: "spring", stiffness: 180, damping: 28 }}
          className="h-full rounded-full bg-gradient-to-r from-crimson-900 via-crimson-500 to-crimson-400"
        />
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        <button
          type="button"
          onClick={toggle}
          className="flex h-8 items-center gap-1.5 rounded-full bg-crimson-500 px-3 text-[11.5px] font-semibold text-black transition-transform duration-150 hover:bg-crimson-400 active:scale-[0.97]"
        >
          {running ? <PauseIcon className="h-3 w-3" /> : <PlayIcon className="h-3 w-3" />}
          {running ? "Duraklat" : "Başlat"}
        </button>
        <button
          type="button"
          onClick={reset}
          className="flex h-8 items-center gap-1.5 rounded-full border border-white/10 px-2.5 text-[11px] text-ink-400 transition-colors hover:border-crimson-500/40 hover:text-white"
        >
          <ResetIcon className="h-3 w-3" />
          Sıfırla
        </button>

        <div className="ml-auto flex items-center gap-1">
          {timerProgressPresets.map((preset) => (
            <button
              key={preset.durationMs}
              type="button"
              onClick={() => setDuration(preset.durationMs)}
              className="rounded-full border border-white/5 px-2 py-1 font-mono text-[10px] text-ink-500 transition-colors hover:border-crimson-500/40 hover:text-crimson-400"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
