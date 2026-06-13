"use client";

import { useOnborda } from "onborda";
import { useEffect, useRef } from "react";

/**
 * Auto-triggers the onboarding tour when the component mounts.
 * Pass the tourName that matches the tour key in Onborda steps.
 */
export function AutoStartOnboarding({ tourName }: { tourName: string }) {
  const { startOnborda } = useOnborda();
  const started = useRef(false);

  useEffect(() => {
    if (!started.current) {
      started.current = true;
      // Small delay to ensure DOM elements with #onborda-* IDs are rendered
      const timer = setTimeout(() => {
        startOnborda(tourName);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [startOnborda, tourName]);

  return null;
}
