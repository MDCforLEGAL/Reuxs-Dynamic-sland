import { motion } from "framer-motion";
import { formatDuration, type NowPlaying, type VisualizerStyle } from "@core";
import { CapsuleGlyph, ChevronDownIcon, MusicIcon, PauseIcon, PlayIcon } from "./icons";
import { Visualizer } from "./Visualizer";

interface CompactCapsuleProps {
  remainingMs: number;
  running: boolean;
  track: NowPlaying | null;
  accent: string;
  visualizer: boolean;
  visualizerStyle: VisualizerStyle;
  onToggleTimer: () => void;
  onTogglePlay: () => void;
  onExpand: () => void;
}

/**
 * Plain capsule: artwork, what is playing and the three controls that are worth
 * one tap. Clock, battery and version deliberately stay in the taskbar / in the
 * control panel — no duplicated system figures here.
 */
export function CompactCapsule({
  remainingMs,
  running,
  track,
  accent,
  visualizer,
  visualizerStyle,
  onToggleTimer,
  onTogglePlay,
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
        {track?.art ? (
          <img
            src={track.art}
            alt=""
            className="h-6 w-6 shrink-0 rounded-full object-cover"
            style={{ boxShadow: `0 0 0 1px ${accent}55` }}
          />
        ) : (
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-crimson-950/90 ring-1 ring-crimson-500/40">
            {track ? (
              <MusicIcon className="h-3.5 w-3.5" style={{ color: accent }} />
            ) : (
              <CapsuleGlyph className="h-3.5 w-3.5 text-crimson-400" />
            )}
          </span>
        )}
        <span className="flex min-w-0 flex-col leading-none">
          <span className="truncate text-[12.5px] font-semibold tracking-[0.02em] text-ink-50">
            {track ? track.title : "ReuXs"}
          </span>
          {track ? (
            <span className="mt-0.5 truncate text-[8.5px] uppercase tracking-[0.18em] text-ink-500">
              {track.artist || "Bilinmeyen sanatçı"}
            </span>
          ) : null}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {track ? (
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={track.playing ? "Duraklat" : "Oynat"}
            className="grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-black/40 transition-colors hover:border-white/25"
          >
            {track.playing ? (
              <PauseIcon className="h-2.5 w-2.5" style={{ color: accent }} />
            ) : (
              <PlayIcon className="h-2.5 w-2.5" style={{ color: accent }} />
            )}
          </button>
        ) : null}

        {track && visualizer ? (
          <Visualizer
            active={track.playing}
            style={visualizerStyle}
            color={accent}
            bars={4}
            className="px-0.5"
          />
        ) : null}

        <button
          type="button"
          onClick={onToggleTimer}
          title={running ? "Zamanlayıcıyı duraklat" : "Zamanlayıcıyı başlat"}
          className="flex h-7 items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2 font-mono text-[11px] tabular-nums text-zinc-200 transition-colors hover:border-white/25 hover:text-white"
        >
          {running ? (
            <PauseIcon className="h-2.5 w-2.5" style={{ color: accent }} />
          ) : (
            <PlayIcon className="h-2.5 w-2.5" style={{ color: accent }} />
          )}
          {formatDuration(remainingMs)}
        </button>

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
