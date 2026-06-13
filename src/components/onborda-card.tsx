"use client";

import type { CardComponentProps } from "onborda";

export function OnbordaCard({ step, currentStep, totalSteps, nextStep, prevStep, arrow }: CardComponentProps) {
  return (
    <div className="w-80 rounded-xl border border-border bg-surface p-5 shadow-lg">
      <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
        <span>
          {currentStep + 1} of {totalSteps}
        </span>
      </div>

      <h3 className="mb-1 text-base font-semibold text-foreground">
        {step.icon} {step.title}
      </h3>

      <div className="mb-4 text-sm leading-relaxed text-muted-foreground">
        {step.content}
      </div>

      <div className="flex items-center justify-between">
        {prevStep ? (
          <button
            onClick={prevStep}
            className="rounded-lg px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-subtle hover:text-foreground"
          >
            Back
          </button>
        ) : (
          <span />
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
          onClick={nextStep}
          className="rounded-lg bg-brand px-4 py-1.5 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90"
        >
          {currentStep === totalSteps - 1 ? "Done" : "Next"}
        </button>
      </div>

      {arrow}
    </div>
  );
}
