import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { CapsuleShell } from "./components/CapsuleShell";
import { CompactCapsule } from "./components/CompactCapsule";
import { ExpandedCapsule } from "./components/ExpandedCapsule";
import { SplitBubbles } from "./components/SplitBubbles";
import { useBattery } from "./hooks/useBattery";
import { useCapsule } from "./hooks/useCapsule";
import { useClock } from "./hooks/useClock";
import { useTimer } from "./hooks/useTimer";
import { useUpdate } from "./hooks/useUpdate";

export default function App() {
  const { state, dispatch } = useCapsule("compact");
  const clock = useClock();
  const battery = useBattery();
  const timer = useTimer(60_000);
  const update = useUpdate();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dispatch({ type: "collapse" });
      if (event.key === "Enter" && state === "compact") dispatch({ type: "expand" });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dispatch, state]);


  const isExpanded = state === "expanded";

  return (
    <div className="flex h-full w-full items-start justify-center bg-transparent px-2 pt-2">
      <AnimatePresence mode="wait" initial={false}>
        {state === "split-bubble" ? (
          <SplitBubbles
            key="split"
            clock={clock}
            battery={battery}
            timer={timer}
            onMerge={() => dispatch({ type: "merge" })}
          />
        ) : (
          <CapsuleShell key="capsule" expanded={isExpanded}>
            {isExpanded ? (
              <ExpandedCapsule
                clock={clock}
                battery={battery}
                timer={timer}
                update={update}
                onCollapse={() => dispatch({ type: "collapse" })}
                onSplit={() => dispatch({ type: "split" })}
                onFocus={() => timer.setDuration(25 * 60_000)}
              />
            ) : (
              <CompactCapsule
                remainingMs={timer.remainingMs}
                running={timer.running}
                battery={battery}
                update={update.status}
                onToggleTimer={timer.toggle}
                onExpand={() => dispatch({ type: "expand" })}
              />
            )}
          </CapsuleShell>
        )}
      </AnimatePresence>
    </div>
  );
}
