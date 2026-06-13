"use client";

import { useOnborda } from "onborda";
import { useEffect, useRef } from "react";

const TOUR_SEEN_PREFIX = "onborda-seen-";

/**
 * Auto-triggers the onboarding tour on first visit.
 * Once completed (Done), stores in localStorage so it never shows again.
 * To reset for testing, clear localStorage or run:
 *   localStorage.removeItem("onborda-seen-<tourName>")
 */
export function AutoStartOnboarding({ tourName }: { tourName: string }) {
  const { startOnborda } = useOnborda();
  const started = useRef(false);

  useEffect(() => {
    const key = `${TOUR_SEEN_PREFIX}${tourName}`;
    if (localStorage.getItem(key) || started.current) return;
    started.current = true;

    const timer = setTimeout(() => startOnborda(tourName), 800);
    return () => clearTimeout(timer);
  }, [startOnborda, tourName]);

  return null;
}

/** Call this when the user completes a tour to mark it as seen. */
export function markTourSeen(tourName: string) {
  localStorage.setItem(`${TOUR_SEEN_PREFIX}${tourName}`, "1");
}

