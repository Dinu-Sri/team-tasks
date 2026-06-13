"use client";

import { useOnborda } from "onborda";
import { useEffect, useRef } from "react";

const TOUR_SEEN_PREFIX = "onborda-seen-";
const FALLBACK_USER = "anonymous";
let activeOnboardingUserId = FALLBACK_USER;

function getTourSeenKey(tourName: string, userId: string) {
  return `${TOUR_SEEN_PREFIX}${userId}-${tourName}`;
}

export function setActiveOnboardingUserId(userId: string) {
  activeOnboardingUserId = userId || FALLBACK_USER;
}

function hasSeenTour(userId: string, tourName: string, seenAliases: string[] = []) {
  const normalizedUserId = userId || FALLBACK_USER;
  const candidates = [tourName, ...seenAliases];
  return candidates.some((name) => localStorage.getItem(getTourSeenKey(name, normalizedUserId)));
}

/**
 * Auto-triggers the onboarding tour on first visit.
 * Once completed (Done), stores in localStorage so it never shows again.
 */
export function AutoStartOnboarding({
  tourName,
  userId,
  seenAliases = [],
  completedInDb = false,
}: {
  tourName: string;
  userId: string;
  seenAliases?: string[];
  completedInDb?: boolean;
}) {
  const { startOnborda } = useOnborda();
  const started = useRef(false);

  useEffect(() => {
    if (completedInDb || hasSeenTour(userId, tourName, seenAliases) || started.current) return;
    started.current = true;

    const timer = setTimeout(() => startOnborda(tourName), 800);
    return () => clearTimeout(timer);
  }, [completedInDb, seenAliases, startOnborda, tourName, userId]);

  return null;
}

/** Call this when the user completes a tour to mark it as seen. */
export function markTourSeen(tourName: string, userId = activeOnboardingUserId) {
  localStorage.setItem(getTourSeenKey(tourName, userId || FALLBACK_USER), "1");
}

