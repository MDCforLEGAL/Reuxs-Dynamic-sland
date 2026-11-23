import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { CAPSULE_LAYOUT, CAPSULE_SPRING, theme } from "@core";

interface CapsuleShellProps {
  expanded: boolean;
  children: ReactNode;
}

export function CapsuleShell({ expanded, children }: CapsuleShellProps) {
  return (
    <div className="relative">
      {/* ambient crimson glow that grows when the capsule is active */}
      <motion.div
        aria-hidden
        initial={false}
        animate={{ opacity: expanded ? 0.85 : 0.35, scale: expanded ? 1 : 0.9 }}
        transition={CAPSULE_SPRING}
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[999px] bg-crimson-600/25 blur-2xl"
      />
      <motion.section
        layout
        initial={false}
        animate={{ width: expanded ? CAPSULE_LAYOUT.expandedWidth : CAPSULE_LAYOUT.compactWidth }}
        transition={CAPSULE_SPRING}
        style={{
          background: expanded ? theme.gradients.expanded : theme.gradients.capsule,
          borderColor: theme.colors.border,
          boxShadow: expanded ? theme.shadows.active : theme.shadows.compact
        }}
        className="relative isolate overflow-hidden rounded-[26px] border backdrop-blur-xl"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{ background: theme.gradients.highlight }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-crimson-400/60 to-transparent"
        />
        <div className="relative z-10">{children}</div>
      </motion.section>
    </div>
  );
}
