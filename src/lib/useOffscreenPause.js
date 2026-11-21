import { useEffect, useRef, useState } from "react";

/**
 * Tracks whether a marquee / animated container is currently off-screen so CSS
 * infinite animations can pause automatically when scrolled out of viewport.
 */
export function useOffscreenPause(rootMargin = "320px 0px") {
  const ref = useRef(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setPaused(!entry.isIntersecting);
        }
      },
      { rootMargin, threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return [ref, paused];
}
