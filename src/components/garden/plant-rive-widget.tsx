"use client";

import { Alignment, Fit, Layout, useRive, useStateMachineInput } from "@rive-app/react-canvas";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const DEFAULT_RIVE_SRC = "/assets/garden/rive/plant_daisy_stage_01_v1.riv";
const PLANT_STATE_MACHINE = "plant";
const PLANT_LEVEL_INPUT = "level";
const GARDEN_TIME_LEVELS = {
  morning: 1,
  day: 2,
  night: 3,
} as const;

function levelForLocalTime(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return GARDEN_TIME_LEVELS.morning;
  if (hour >= 12 && hour < 18) return GARDEN_TIME_LEVELS.day;
  return GARDEN_TIME_LEVELS.night;
}

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
  const [timeLevel, setTimeLevel] = useState(() => levelForLocalTime());
  const { rive, RiveComponent } = useRive({
    src,
    stateMachines: PLANT_STATE_MACHINE,
    autoplay: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
  });
  const levelInput = useStateMachineInput(rive, PLANT_STATE_MACHINE, PLANT_LEVEL_INPUT, timeLevel);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLevel(levelForLocalTime());
    }, 60000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!levelInput) return;
    levelInput.value = timeLevel;
  }, [levelInput, timeLevel]);

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
