"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function RealtimeRefresh() {
  const router = useRouter();

  useEffect(() => {
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => router.refresh(), 120);
    };

    const events = new EventSource("/api/realtime");
    events.addEventListener("update", refresh);

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("focus", refresh);

    const recoveryRefresh = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 60000);

    return () => {
      events.close();
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("focus", refresh);
      clearInterval(recoveryRefresh);
      if (refreshTimer) clearTimeout(refreshTimer);
    };
  }, [router]);

  return null;
}
