export { formatDuration } from "@core";

export interface TimerPreset {
  label: string;
  durationMs: number;
}

export const timerProgressPresets: TimerPreset[] = [
  { label: "1dk", durationMs: 60_000 },
  { label: "5dk", durationMs: 5 * 60_000 },
  { label: "15dk", durationMs: 15 * 60_000 }
];
