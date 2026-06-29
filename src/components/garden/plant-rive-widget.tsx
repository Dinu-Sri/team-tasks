"use client";

import { Alignment, Fit, Layout, useRive } from "@rive-app/react-canvas";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const DEFAULT_RIVE_SRC = "/assets/garden/rive/plant_daisy_stage_01_v1.riv";

type GardenRiveConfig = {
  enabled: boolean;
  src?: string;
};

export function PlantRiveRuntimeGate() {
  const [config, setConfig] = useState<GardenRiveConfig | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadConfig() {
      try {
        const response = await fetch("/api/garden/rive-config", { cache: "no-store" });
        if (!response.ok) return;
        const nextConfig = (await response.json()) as GardenRiveConfig;
        if (!cancelled) setConfig(nextConfig);
      } catch {
        if (!cancelled) setConfig({ enabled: false });
      }
    }

    void loadConfig();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!config?.enabled) return null;

  return <PlantRiveWidget src={config.src || DEFAULT_RIVE_SRC} />;
}

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
        "pointer-events-none fixed bottom-24 right-4 z-[45] h-28 w-28 overflow-hidden bg-transparent sm:bottom-28 sm:right-6 sm:h-32 sm:w-32",
        className,
      )}
      aria-hidden="true"
    >
      <RiveComponent className="h-full w-full bg-transparent" />
    </div>
  );
}
