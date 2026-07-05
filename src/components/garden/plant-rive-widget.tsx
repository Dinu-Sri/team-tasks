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

function useCompactGardenViewport() {
  const [compactViewport, setCompactViewport] = useState<boolean | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 1023px)");
    const update = () => setCompactViewport(query.matches);

    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return compactViewport;
}

export function PlantRiveRuntimeGate() {
  const [config, setConfig] = useState<GardenRiveConfig | null>(null);
  const compactViewport = useCompactGardenViewport();

  useEffect(() => {
    if (compactViewport !== false) return;
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
  }, [compactViewport]);

  if (compactViewport !== false || !config?.enabled) return null;

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
        "pointer-events-none fixed bottom-28 right-6 z-[45] hidden h-32 w-32 overflow-hidden bg-transparent lg:block",
        className,
      )}
      aria-hidden="true"
    >
      <RiveComponent className="h-full w-full bg-transparent" />
    </div>
  );
}
