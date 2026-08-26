import { useEffect, useState } from "react";
import { useNavigation } from "react-router";

// The bar stays mounted and is driven by transitions. Mounted and unmounted with
// the navigation it never gets a frame to paint in, and a finish would snap
// rather than continue from where the crawl reached.
const PHASES = {
  idle: "w-0 opacity-0 transition-none",
  loading: "w-4/5 opacity-100 transition-[width] duration-[20s] ease-out",
  done: "w-full opacity-100 transition-[width] duration-[200ms] ease-out",
  fading: "w-full opacity-0 transition-[opacity] duration-[250ms] ease-out",
};

// Stepped on a timer rather than on transitionend. A second navigation can land
// the bar on a width it already holds, and the event that never fires would
// leave it on screen.
const FINISH = {
  done: { next: "fading", after: 200 },
  fading: { next: "idle", after: 250 },
} as const;

const PageLoader = () => {
  const { state } = useNavigation();
  const [phase, setPhase] = useState<keyof typeof PHASES>("idle");

  useEffect(() => {
    if (state !== "idle") {
      setPhase("loading");

      return;
    }

    setPhase((current) => (current === "loading" ? "done" : "idle"));
  }, [state]);

  useEffect(() => {
    if (phase === "idle" || phase === "loading") {
      return;
    }

    const step = FINISH[phase];
    const timer = setTimeout(() => setPhase(step.next), step.after);

    return () => clearTimeout(timer);
  }, [phase]);

  return (
    <div
      aria-hidden="true"
      className={`fixed top-0 left-0 z-50 h-[1.5px] bg-line-strong ${PHASES[phase]}`}
    />
  );
};

export default PageLoader;
