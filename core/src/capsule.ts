/**
 * ReuXs capsule state machine.
 *
 * Platform independent: the Windows UI (React) and the Android overlay
 * (Kotlin, see CapsuleState.kt) implement exactly these rules.
 */
import type { TimerState } from "./timer";

export const CAPSULE_STATES = ["idle", "compact", "expanded", "split-bubble"] as const;
export type CapsuleState = (typeof CAPSULE_STATES)[number];

export const CAPSULE_MODULES = ["status", "timer", "actions", "update"] as const;
export type CapsuleModule = (typeof CAPSULE_MODULES)[number];

export type CapsuleEvent =
  | { type: "activate" }
  | { type: "expand" }
  | { type: "collapse" }
  | { type: "split" }
  | { type: "merge" }
  | { type: "dismiss" }
  | { type: "open-module"; module: CapsuleModule };

/** Allowed transitions. Anything else is ignored (state is unchanged). */
export const CAPSULE_TRANSITIONS: Record<CapsuleState, readonly CapsuleState[]> = {
  idle: ["compact", "expanded"],
  compact: ["expanded", "split-bubble", "idle"],
  expanded: ["compact", "split-bubble", "idle"],
  "split-bubble": ["compact", "expanded"]
};

export function canTransition(from: CapsuleState, to: CapsuleState): boolean {
  return CAPSULE_TRANSITIONS[from].includes(to);
}

export function nextState(from: CapsuleState, event: CapsuleEvent): CapsuleState {
  switch (event.type) {
    case "activate":
      return from === "idle" ? "compact" : "expanded";
    case "expand":
      return from === "idle" ? "compact" : "expanded";
    case "collapse":
      return from === "idle" ? "idle" : "compact";
    case "split":
      return from === "idle" ? "compact" : "split-bubble";
    case "merge":
      return "compact";
    case "dismiss":
      return "idle";
    case "open-module":
      return from === "idle" ? "compact" : "expanded";
    default:
      return from;
  }
}

export interface CapsuleSnapshot {
  state: CapsuleState;
  activeModule: CapsuleModule | null;
  timer: TimerState;
  battery: number | null;
  notifications: number;
  updateAvailable: boolean;
  updateUrl: string | null;
  lastUpdateCheck: number | null;
}

export function createSnapshot(overrides: Partial<CapsuleSnapshot> = {}): CapsuleSnapshot {
  return {
    state: "compact",
    activeModule: "status",
    timer: { durationMs: 60_000, remainingMs: 60_000, running: false },
    battery: null,
    notifications: 0,
    updateAvailable: false,
    updateUrl: null,
    lastUpdateCheck: null,
    ...overrides
  };
}

/** Spring used for every compact <-> expanded <-> split transition. */
export const CAPSULE_SPRING = { type: "spring", stiffness: 420, damping: 34, mass: 0.9 } as const;

export const CAPSULE_LAYOUT = {
  compactWidth: 268,
  expandedWidth: 420,
  splitBubbleWidth: 196,
  compactHeight: 44,
  expandedHeight: 214,
  splitBubbleHeight: 68
} as const;
