import type { UpdateStatus } from "@core";
import { openExternal } from "../lib/os";
import { ArrowUpRightIcon, DownloadIcon } from "./icons";

interface UpdateBadgeProps {
  status: UpdateStatus;
}

export function UpdateBadge({ status }: UpdateBadgeProps) {
  return (
    <button
      type="button"
      onClick={() => void openExternal(status.downloadUrl)}
      className="group flex w-full items-center gap-2 rounded-[14px] border border-crimson-500/45 bg-gradient-to-r from-crimson-950/90 via-[#2a0a0a]/90 to-black/80 px-2.5 py-2 text-left transition-colors hover:border-crimson-400/70"
      title={status.downloadUrl}
    >
      <span className="grid h-6 w-6 place-items-center rounded-full bg-crimson-500/15 ring-1 ring-crimson-500/40">
        <DownloadIcon className="h-3 w-3 text-crimson-400" />
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="text-[11px] font-semibold text-ink-50">
          Güncelleme Mevcut
          {status.latestVersion ? (
            <span className="ml-1 font-mono text-[10px] text-crimson-400">
              v{status.latestVersion}
            </span>
          ) : null}
        </span>
        <span className="text-[9.5px] text-ink-500">
          Şu an v{status.currentVersion} · indirmek için tıkla
        </span>
      </span>
      <ArrowUpRightIcon className="ml-auto h-3.5 w-3.5 shrink-0 text-crimson-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </button>
  );
}
