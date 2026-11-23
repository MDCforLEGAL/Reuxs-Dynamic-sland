import { motion } from "framer-motion";

interface StatusBadgeProps {
  label?: string;
}

export function StatusBadge({ label = "ReuXs aktif" }: StatusBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-crimson-500/30 bg-crimson-950/40 px-2 py-1">
      <span className="relative flex h-1.5 w-1.5">
        <motion.span
          animate={{ opacity: [0.35, 1, 0.35], scale: [0.9, 1.15, 0.9] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full bg-crimson-400"
        />
        <span className="relative h-1.5 w-1.5 rounded-full bg-crimson-500" />
      </span>
      <span className="text-[9.5px] font-medium uppercase tracking-[0.16em] text-crimson-100/90">
        {label}
      </span>
    </span>
  );
}
