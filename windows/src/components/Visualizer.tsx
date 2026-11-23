import type { VisualizerStyle } from "@core";

interface VisualizerProps {
  active: boolean;
  style: VisualizerStyle;
  color: string;
  /** Number of bars/wave dots. */
  bars?: number;
  className?: string;
}

const BAR_HEIGHTS = ["38%", "72%", "52%", "96%", "64%", "84%", "46%"];
const WAVE_HEIGHTS = ["22%", "48%", "86%", "52%", "100%", "58%", "32%"];

/**
 * Lightweight, dependency-free audio visualizer. It reacts to playback state
 * rather than the raw audio signal (system media sessions do not expose one),
 * which keeps the capsule at ~0 CPU cost when nothing is playing.
 */
export function Visualizer({
  active,
  style,
  color,
  bars = 5,
  className = ""
}: VisualizerProps) {
  const heights = style === "wave" ? WAVE_HEIGHTS : BAR_HEIGHTS;

  return (
    <div
      aria-hidden
      className={`flex items-end gap-[2px] ${className}`}
      style={{ height: 16 }}
    >
      {Array.from({ length: bars }, (_, index) => (
        <span
          key={index}
          className={active ? "reuxs-bar" : "reuxs-bar reuxs-bar--idle"}
          style={{
            background: color,
            height: heights[index % heights.length],
            width: style === "wave" ? 3 : 2,
            opacity: active ? 0.95 : 0.35,
            animationDelay: `${index * 0.12}s`,
            animationDuration: `${820 + (index % 3) * 130}ms`
          }}
        />
      ))}
    </div>
  );
}
