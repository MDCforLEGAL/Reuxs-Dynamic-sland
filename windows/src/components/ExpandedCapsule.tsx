import { motion } from "framer-motion";
import type { AlbumPalette, CapsulePanels, NowPlaying, VisualizerStyle } from "@core";
import type { MediaAction } from "../hooks/useNowPlaying";
import type { TimerApi } from "../hooks/useTimer";
import { MusicCard } from "./MusicCard";
import { QuickActions } from "./QuickActions";
import { TimerPanel } from "./TimerPanel";
import { CapsuleGlyph, ChevronDownIcon, SettingsIcon } from "./icons";

interface ExpandedCapsuleProps {
  timer: TimerApi;
  track: NowPlaying | null;
  palette: AlbumPalette | null;
  accent: string;
  visualizer: boolean;
  visualizerStyle: VisualizerStyle;
  panels: CapsulePanels;
  onControl: (action: MediaAction) => void;
  onCollapse: () => void;
  onSplit: () => void;
  onFocus: () => void;
  onOpenSettings: () => void;
}

/**
 * What opens when the capsule is tapped. The panel decides which cards exist,
 * so a minimal setup can be just the player — or the timer alone.
 */
export function ExpandedCapsule({
  timer,
  track,
  palette,
  accent,
  visualizer,
  visualizerStyle,
  panels,
  onControl,
  onCollapse,
  onSplit,
  onFocus,
  onOpenSettings
}: ExpandedCapsuleProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, delay: 0.04 }}
      className="flex w-full flex-col"
    >
      <header data-tauri-drag-region className="flex items-center gap-2 px-3.5 pb-2 pt-3">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-crimson-950/90 ring-1 ring-crimson-500/40">
          <CapsuleGlyph className="h-4 w-4 text-crimson-400" />
        </span>
        <span
          data-tauri-drag-region
          className="flex-1 text-[13px] font-semibold tracking-[0.02em] text-ink-50"
        >
          ReuXs
        </span>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="ReuXs Kontrol Paneli"
          title="ReuXs Kontrol Paneli"
          className="grid h-7 w-7 place-items-center rounded-full text-ink-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <SettingsIcon className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onCollapse}
          aria-label="Kapsülü daralt"
          className="grid h-7 w-7 place-items-center rounded-full text-ink-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ChevronDownIcon className="h-3.5 w-3.5 rotate-180" />
        </button>
      </header>

      <div className="flex flex-col gap-1.5 px-3 pb-3">
        {panels.music ? (
          <MusicCard
            track={track}
            palette={palette}
            accent={accent}
            visualizer={visualizer}
            visualizerStyle={visualizerStyle}
            onControl={onControl}
          />
        ) : null}
        {panels.timer ? <TimerPanel timer={timer} /> : null}
        {panels.actions ? (
          <QuickActions onSplit={onSplit} onFocus={onFocus} onOpenSettings={onOpenSettings} />
        ) : null}
      </div>
    </motion.div>
  );
}
