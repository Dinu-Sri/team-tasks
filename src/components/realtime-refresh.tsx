"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function RealtimeRefresh() {
  const router = useRouter();

  useEffect(() => {
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => router.refresh(), 250);
    };

    const events = new EventSource("/api/realtime");
    events.addEventListener("update", refresh);

    return () => {
      events.close();
      if (refreshTimer) clearTimeout(refreshTimer);
    };
  }, [router]);

  return null;
}
