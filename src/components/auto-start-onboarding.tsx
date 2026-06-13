"use client";

import { useOnborda } from "onborda";
import { useEffect, useRef } from "react";

/**
 * Auto-triggers the onboarding tour on first visit.
 * Uses localStorage to track whether this tour has been completed.
 */
export function AutoStartOnboarding({ tourName }: { tourName: string }) {
  const { startOnborda } = useOnborda();
  const started = useRef(false);

  useEffect(() => {
    const storageKey = `onborda-${tourName}-seen`;

    // Skip if user has already seen this tour
    if (localStorage.getItem(storageKey) || started.current) return;

    started.current = true;
    localStorage.setItem(storageKey, "1");

    // Delay to ensure DOM elements with #onborda-* IDs are rendered
    const timer = setTimeout(() => {
      startOnborda(tourName);
    }, 800);
    return () => clearTimeout(timer);
  }, [startOnborda, tourName]);

  return null;
}

