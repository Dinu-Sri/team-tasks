"use client";

import { Alignment, Fit, Layout, useRive } from "@rive-app/react-canvas";

import { cn } from "@/lib/utils";

const DEFAULT_RIVE_SRC = "/assets/garden/rive/plant_daisy_stage_01_v1.riv";

export function PlantRiveWidget({
  src = DEFAULT_RIVE_SRC,
  className,
}: {
  src?: string;
  className?: string;
}) {
  const { RiveComponent } = useRive({
    src,
    autoplay: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
  });

  return (
    <div
      className={cn(
        "pointer-events-none fixed bottom-4 right-4 z-30 h-24 w-24 overflow-hidden bg-transparent sm:bottom-5 sm:right-5 sm:h-28 sm:w-28",
        className,
      )}
      aria-hidden="true"
    >
      <RiveComponent className="h-full w-full bg-transparent" />
    </div>
  );
}
