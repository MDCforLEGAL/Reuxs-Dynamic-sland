import { useCallback, useState } from "react";
import { nextState, type CapsuleEvent, type CapsuleState } from "@core";

export function useCapsule(initial: CapsuleState = "compact") {
  const [state, setState] = useState<CapsuleState>(initial);

  const dispatch = useCallback((event: CapsuleEvent) => {
    setState((previous) => nextState(previous, event));
  }, []);

  return { state, dispatch, setState };
}
