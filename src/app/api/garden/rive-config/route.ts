import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_RIVE_SRC = "/assets/garden/rive/plant_daisy_stage_01_v1.riv";

function enabled(value: string | undefined) {
  return value?.trim().toLowerCase() === "true";
}

export async function GET() {
  const isEnabled =
    enabled(process.env.TUDUVIA_GARDEN_RIVE_ENABLED) ||
    enabled(process.env.NEXT_PUBLIC_TUDUVIA_GARDEN_RIVE_ENABLED);

  return NextResponse.json(
    {
      enabled: isEnabled,
      src: process.env.NEXT_PUBLIC_TUDUVIA_GARDEN_RIVE_SRC || DEFAULT_RIVE_SRC,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
