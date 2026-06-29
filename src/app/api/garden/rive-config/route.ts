import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_RIVE_SRC = "/assets/garden/rive/plant_daisy_stage_01_v1.riv";

function normalizedFlag(value: string | undefined) {
  const normalized = value?.trim().toLowerCase();
  return normalized === "true" || normalized === "false" ? normalized : null;
}

export async function GET() {
  const serverFlag = normalizedFlag(process.env.TUDUVIA_GARDEN_RIVE_ENABLED);
  const publicFlag = normalizedFlag(process.env.NEXT_PUBLIC_TUDUVIA_GARDEN_RIVE_ENABLED);
  const explicitFlag = serverFlag ?? publicFlag;
  const isEnabled = explicitFlag ? explicitFlag === "true" : process.env.NODE_ENV === "production";

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
