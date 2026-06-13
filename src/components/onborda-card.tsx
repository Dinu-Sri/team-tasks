"use client";

import { useOnborda } from "onborda";
import type { CardComponentProps } from "onborda";
import { markTourSeen } from "@/components/auto-start-onboarding";

export function OnbordaCard({ step, currentStep, totalSteps, nextStep, prevStep, arrow }: CardComponentProps) {
  const { closeOnborda, currentTour } = useOnborda();

  function handleDone() {
    // Mark as seen so it doesn't auto-trigger again
    if (currentTour) markTourSeen(currentTour);
    closeOnborda();
  }

  const isLast = currentStep === totalSteps - 1;

  return (
    <div className="w-[calc(100vw-2rem)] max-w-80 rounded-xl border border-border bg-surface p-4 shadow-lg sm:w-80 sm:p-5">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span>
          {currentStep + 1} of {totalSteps}
        </span>
      </div>

      <h3 className="mb-1 text-sm font-semibold text-foreground sm:text-base">
        {step.icon} {step.title}
      </h3>

      <div className="mb-3 text-sm leading-relaxed text-muted-foreground">
        {step.content}
      </div>

      <div className="flex items-center justify-between gap-2">
        {prevStep ? (
          <button
            onClick={prevStep}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-subtle hover:text-foreground"
          >
            Back
          </button>
        ) : (
          <span className="w-12" />
        )}

        <div className="flex gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${
                i === currentStep ? "bg-brand" : "bg-surface-subtle"
              }`}
            />
          ))}
        </div>

        <button
          onClick={isLast ? handleDone : nextStep}
          className="rounded-lg bg-brand px-4 py-1.5 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90"
        >
          {isLast ? "Done" : "Next"}
        </button>
      </div>

      {arrow}
    </div>
  );
}
