"use client";

import { Onborda, OnbordaProvider } from "onborda";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { AutoStartOnboarding, setActiveOnboardingUserId } from "@/components/auto-start-onboarding";
import { OnbordaCard } from "@/components/onborda-card";
import type { Step } from "onborda";

export function OnboardingProvider({
  children,
  steps,
  tourName,
  userId,
  seenAliases = [],
  completedInDb = false,
}: {
  children: ReactNode;
  steps: Step[];
  tourName: string;
  userId: string;
  seenAliases?: string[];
  completedInDb?: boolean;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setActiveOnboardingUserId(userId);
  }, [userId]);

  return (
    <OnbordaProvider>
      <Onborda
        steps={[{ tour: tourName, steps }]}
        showOnborda
        shadowRgb="55,48,163"
        shadowOpacity="0.7"
        cardComponent={OnbordaCard}
        cardTransition={{ duration: 0.3, type: "tween" }}
      >
        {ready ? (
          <AutoStartOnboarding
            tourName={tourName}
            userId={userId}
            seenAliases={seenAliases}
            completedInDb={completedInDb}
          />
        ) : null}
        {children}
      </Onborda>
    </OnbordaProvider>
  );
}
