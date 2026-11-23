import { useCallback, useEffect, useState } from "react";
import { APP_VERSION, UPDATE_IDLE, checkForUpdate, type UpdateStatus } from "@core";

export interface UpdateApi {
  status: UpdateStatus;
  checking: boolean;
  refresh: () => Promise<void>;
}

/** Checks GitHub once at startup (delayed so it never competes with first paint). */
export function useUpdate(): UpdateApi {
  const [status, setStatus] = useState<UpdateStatus>(UPDATE_IDLE);
  const [checking, setChecking] = useState(false);

  const refresh = useCallback(async () => {
    setChecking(true);
    const next = await checkForUpdate(APP_VERSION);
    setStatus(next);
    setChecking(false);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void refresh();
    }, 1200);
    return () => window.clearTimeout(id);
  }, [refresh]);

  return { status, checking, refresh };
}
