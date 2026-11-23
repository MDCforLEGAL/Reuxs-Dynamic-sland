import { motion } from "framer-motion";
import {
  formatPlayback,
  playbackProgress,
  type AlbumPalette,
  type NowPlaying,
  type VisualizerStyle
} from "@core";
import type { MediaAction } from "../hooks/useNowPlaying";
import { NextIcon, PauseIcon, PlayIcon } from "./icons";
import { Visualizer } from "./Visualizer";

interface MusicCardProps {
  track: NowPlaying | null;
  palette: AlbumPalette | null;
  accent: string;
  visualizer: boolean;
  visualizerStyle: VisualizerStyle;
  onControl: (action: MediaAction) => void;
}

/** Expanded-capsule music module: cover, title, seek bar and transport. */
export function MusicCard({
  track,
  palette,
  accent,
  visualizer,
  visualizerStyle,
  onControl
}: MusicCardProps) {
  if (!track) {
    return (
      <div className="flex items-center gap-2 rounded-[16px] border border-white/5 bg-black/30 px-2.5 py-2">
        <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-white/5 text-ink-500">
          <PlayIcon className="h-3 w-3" />
        </span>
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="text-[10.5px] font-medium text-zinc-300">Müzik bekleniyor</span>
          <span className="text-[9px] text-ink-500">
            Spotify, YouTube, VLC… çalmaya başlayınca burada görünür
          </span>
        </div>
      </div>
    );
  }

  const progress = playbackProgress(track);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="flex flex-col gap-1.5 rounded-[16px] border border-white/5 bg-black/35 px-2.5 py-2"
      style={{ boxShadow: palette ? `inset 0 0 0 1px ${palette.dominant}22` : undefined }}
    >
      <div className="flex items-center gap-2">
        <span
          className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-white/5"
          style={{ boxShadow: `0 0 0 1px ${accent}44` }}
        >
          {track.art ? (
            <img src={track.art} alt="" className="h-full w-full object-cover" />
          ) : (
            <PlayIcon className="h-3.5 w-3.5 text-crimson-400" />
          )}
        </span>

        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-[11px] font-semibold text-ink-50" title={track.title}>
            {track.title}
          </span>
          <span className="truncate text-[9.5px] text-ink-400" title={track.artist}>
            {track.artist || "Bilinmeyen sanatçı"}
            {track.album ? ` · ${track.album}` : ""}
          </span>
        </div>

        {visualizer ? (
          <Visualizer
            active={track.playing}
            style={visualizerStyle}
            color={accent}
            bars={5}
            className="mr-1"
          />
        ) : null}

        <button
          type="button"
          onClick={() => onControl("toggle")}
          aria-label={track.playing ? "Duraklat" : "Oynat"}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-white transition-transform hover:scale-105"
          style={{ background: accent }}
        >
          {track.playing ? (
            <PauseIcon className="h-3 w-3 text-black" />
          ) : (
            <PlayIcon className="h-3 w-3 text-black" />
          )}
        </button>
        <button
          type="button"
          onClick={() => onControl("next")}
          aria-label="Sonraki parça"
          className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-ink-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <NextIcon className="h-3 w-3" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="w-7 shrink-0 text-right font-mono text-[8.5px] tabular-nums text-ink-500">
          {formatPlayback(track.positionMs)}
        </span>
        <span className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-white/10">
          <span
            className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500"
            style={{ width: `${Math.round(progress * 100)}%`, background: accent }}
          />
        </span>
        <span className="w-7 shrink-0 font-mono text-[8.5px] tabular-nums text-ink-500">
          {track.durationMs > 0 ? formatPlayback(track.durationMs) : "--:--"}
        </span>
      </div>
    </motion.div>
  );
}
