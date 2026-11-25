import { useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { capsuleAppearance, hasTrack } from "@core";
import { CapsuleShell } from "./components/CapsuleShell";
import { CompactCapsule } from "./components/CompactCapsule";
import { ExpandedCapsule } from "./components/ExpandedCapsule";
import { SplitBubbles } from "./components/SplitBubbles";
import { useAlbumPalette } from "./hooks/useAlbumPalette";
import { useCapsule } from "./hooks/useCapsule";
import { useNowPlaying } from "./hooks/useNowPlaying";
import { useSettings } from "./hooks/useSettings";
import { useTimer } from "./hooks/useTimer";
import { invokeSafe, isTauri, openSettings } from "./lib/os";

const COMPACT_WIDTH = 190;
const COMPACT_WIDTH_MUSIC = 280;

export function CapsuleApp() {
  const { state, dispatch } = useCapsule("compact");
  const timer = useTimer(60_000);
  const { settings } = useSettings();

  const nowPlaying = useNowPlaying(settings.musicEnabled);
  const track = hasTrack(nowPlaying.track) ? nowPlaying.track : null;
  const palette = useAlbumPalette(track?.art ?? null, settings.adaptivePalette);
  const appearance = capsuleAppearance(settings, settings.adaptivePalette ? palette : null);

  // Position + scale live in Rust (they move the real window); debounce the
  // slider so dragging stays smooth.
  const layoutKey = `${settings.offsetX}:${settings.offsetY}:${settings.scale}`;
  const lastLayout = useRef("");
  useEffect(() => {
    if (!isTauri() || lastLayout.current === layoutKey) return;
    const id = window.setTimeout(() => {
      lastLayout.current = layoutKey;
      void invokeSafe("apply_capsule_layout", {
        offsetX: settings.offsetX,
        offsetY: settings.offsetY,
        scale: settings.scale
      });
    }, 120);
    return () => window.clearTimeout(id);
  }, [layoutKey, settings.offsetX, settings.offsetY, settings.scale]);

  // Hide / show the whole capsule window from the control panel.
  useEffect(() => {
    if (!isTauri()) return;
    void invokeSafe("set_capsule_visible", { visible: !settings.capsuleHidden });
  }, [settings.capsuleHidden]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dispatch({ type: "collapse" });
      if (event.key === "Enter" && state === "compact") dispatch({ type: "expand" });
      if (event.key.toLowerCase() === "s" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        void openSettings();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dispatch, state]);

  const isExpanded = state === "expanded";

  return (
    <div className="flex h-full w-full items-start justify-center bg-transparent px-2 pt-2">
      <div
        style={{
          transform: `scale(${settings.scale})`,
          transformOrigin: "top center"
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {state === "split-bubble" ? (
            <SplitBubbles
              key="split"
              track={track}
              timer={timer}
              onMerge={() => dispatch({ type: "merge" })}
            />
          ) : (
            <CapsuleShell
              key="capsule"
              expanded={isExpanded}
              compactWidth={track ? COMPACT_WIDTH_MUSIC : COMPACT_WIDTH}
              settings={settings}
              appearance={appearance}
            >
              {isExpanded ? (
                <ExpandedCapsule
                  timer={timer}
                  track={track}
                  palette={palette}
                  accent={appearance.accent}
                  visualizer={settings.visualizer}
                  visualizerStyle={settings.visualizerStyle}
                  panels={settings.capsulePanels}
                  onControl={nowPlaying.control}
                  onCollapse={() => dispatch({ type: "collapse" })}
                  onSplit={() => dispatch({ type: "split" })}
                  onFocus={() => timer.setDuration(25 * 60_000)}
                  onOpenSettings={() => void openSettings()}
                />
              ) : (
                <CompactCapsule
                  remainingMs={timer.remainingMs}
                  running={timer.running}
                  track={track}
                  accent={appearance.accent}
                  visualizer={settings.visualizer}
                  visualizerStyle={settings.visualizerStyle}
                  onToggleTimer={timer.toggle}
                  onTogglePlay={() => nowPlaying.control("toggle")}
                  onExpand={() => dispatch({ type: "expand" })}
                />
              )}
            </CapsuleShell>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
