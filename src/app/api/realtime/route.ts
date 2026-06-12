import { getSessionUser } from "@/lib/auth";
import { subscribeToUserEvents } from "@/lib/realtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const encoder = new TextEncoder();
  let dispose = () => {};

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (value: string) => {
        if (!closed) controller.enqueue(encoder.encode(value));
      };

      send(`event: connected\ndata: ${JSON.stringify({ connectedAt: new Date().toISOString() })}\n\n`);

      const unsubscribe = await subscribeToUserEvents(user.id, (event) => {
        send(`event: update\ndata: ${JSON.stringify(event)}\n\n`);
      });
      if (request.signal.aborted) {
        closed = true;
        unsubscribe();
        controller.close();
        return;
      }

      const heartbeat = setInterval(() => send(": heartbeat\n\n"), 15000);

      dispose = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        unsubscribe();
      };

      request.signal.addEventListener("abort", () => {
        dispose();
        try {
          controller.close();
        } catch {
          // The browser may close the stream before the abort signal arrives.
        }
      }, { once: true });
    },
    cancel() {
      dispose();
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream",
      "X-Accel-Buffering": "no",
    },
  });
}
