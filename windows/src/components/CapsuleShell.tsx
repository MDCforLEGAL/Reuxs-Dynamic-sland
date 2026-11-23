import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { CAPSULE_SPRING, type CapsuleAppearance, type ReuxsSettings } from "@core";

interface CapsuleShellProps {
  expanded: boolean;
  compactWidth: number;
  settings: ReuxsSettings;
  appearance: CapsuleAppearance;
  children: ReactNode;
}

/**
 * Capsule surface. Every visual token (gradient, border, glow, radius,
 * opacity, blur) comes from the control panel, so a slider drag shows up here
 * immediately with a soft transition.
 */
export function CapsuleShell({
  expanded,
  compactWidth,
  settings,
  appearance,
  children
}: CapsuleShellProps) {
  const glow = settings.glow / 100;
  const radius = `${settings.radius}px`;

  return (
    <div className="relative">
      {/* ambient glow that grows when the capsule is active */}
      <motion.div
        aria-hidden
        initial={false}
        animate={{ opacity: expanded ? 0.55 + glow * 0.45 : 0.18 + glow * 0.35, scale: expanded ? 1 : 0.9 }}
        transition={CAPSULE_SPRING}
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[999px] blur-2xl"
        style={{
          background: appearance.glow,
          filter: `blur(${14 + glow * 22}px)`
        }}
      />

      <motion.section
        layout
        initial={false}
        animate={{ width: expanded ? 420 : compactWidth }}
        transition={CAPSULE_SPRING}
        style={{
          borderRadius: radius,
          borderColor: appearance.border,
          boxShadow: `0 0 0 1px ${appearance.border}, 0 10px ${
            18 + glow * 26
          }px -14px ${appearance.glow}`
        }}
        className="relative isolate overflow-hidden border backdrop-blur-xl"
      >
        {/* gradient + opacity are separate so the opacity slider feels real */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: expanded ? appearance.expandedGradient : appearance.gradient,
            opacity: settings.opacity,
            backdropFilter: `blur(${settings.blur}px)`
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-6 top-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${appearance.border}, transparent)`
          }}
        />
        <div className="relative z-10">{children}</div>
      </motion.section>
    </div>
  );
}
