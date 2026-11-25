import { BoltIcon, SettingsIcon, SplitIcon } from "./icons";

interface QuickActionsProps {
  onSplit: () => void;
  onFocus: () => void;
  onOpenSettings: () => void;
}

const tile =
  "flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[12px] border border-white/8 bg-white/[0.03] text-[10.5px] text-ink-400 transition-colors hover:border-crimson-500/40 hover:bg-crimson-950/40 hover:text-white active:scale-[0.98]";

/** Capsule-side shortcuts only; updates and settings live in the panel. */
export function QuickActions({ onSplit, onFocus, onOpenSettings }: QuickActionsProps) {
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={onSplit} className={tile} title="Kapsülü iki baloncuğa böl">
        <SplitIcon className="h-3.5 w-3.5 text-crimson-400/80" />
        Böl
      </button>
      <button type="button" onClick={onFocus} className={tile} title="25 dakikalık odak zamanlayıcısı">
        <BoltIcon className="h-3.5 w-3.5 text-crimson-400/80" />
        Odak 25
      </button>
      <button type="button" onClick={onOpenSettings} className={tile} title="Kontrol panelini aç">
        <SettingsIcon className="h-3.5 w-3.5 text-crimson-400/80" />
        Panel
      </button>
    </div>
  );
}
