"use client";

import { useState } from "react";
import * as Sentry from "@sentry/nextjs";

export default function SentryExamplePage() {
  const [sent, setSent] = useState(false);

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>Sentry Example Page</h1>
      <p>Click the button below to trigger a test error and verify Sentry is working.</p>
      <button
        onClick={() => {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (globalThis as any).myUndefinedFunction();
          } catch (e) {
            Sentry.captureException(e);
            setSent(true);
          }
        }}
        style={{
          padding: "12px 24px",
          fontSize: "16px",
          background: "#6C5FC7",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        {sent ? "✅ Error sent to Sentry!" : "Throw Test Error"}
      </button>
    </main>
  );
}
