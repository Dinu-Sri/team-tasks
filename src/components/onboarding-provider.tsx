"use client";

import { Onborda, OnbordaProvider } from "onborda";
import type { ReactNode } from "react";

import { OnbordaCard } from "@/components/onborda-card";
import type { Step } from "onborda";

export function OnboardingProvider({
  children,
  steps,
  tourName,
}: {
  children: ReactNode;
  steps: Step[];
  tourName: string;
}) {
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
        {children}
      </Onborda>
    </OnbordaProvider>
  );
}
