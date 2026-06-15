import "server-only";

import { EventEmitter } from "events";
import { Client } from "pg";

import { db } from "@/lib/db";

const CHANNEL = "team_tasks_events";

export type RealtimeEvent = {
  userIds: string[];
  type:
    | "task.created"
    | "task.updated"
    | "invite.created"
    | "invite.accepted"
    | "team.created"
    | "notification.updated"
    | "momentum.updated"
    | "quest.updated"
    | "feature.updated"
    | "comment.created"
    | "comment.read"
    | "attachment.created"
    | "attachment.deleted"
    | "membership.updated";
  sentAt: string;
};

type RealtimeState = {
  emitter: EventEmitter;
  listener?: Client;
  listenerPromise?: Promise<void>;
  retryTimer?: ReturnType<typeof setTimeout>;
};

const globalRealtime = globalThis as typeof globalThis & { teamTasksRealtime?: RealtimeState };

const state = globalRealtime.teamTasksRealtime ?? {
  emitter: new EventEmitter(),
};

state.emitter.setMaxListeners(0);
globalRealtime.teamTasksRealtime = state;

function scheduleReconnect() {
  if (state.retryTimer) return;
  state.retryTimer = setTimeout(() => {
    state.retryTimer = undefined;
    void startListener();
  }, 2000);
}

async function startListener() {
  if (state.listenerPromise) return state.listenerPromise;

  state.listenerPromise = (async () => {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is required for realtime updates.");

    const client = new Client({ connectionString, application_name: "team-tasks-realtime" });
    client.on("notification", (message) => {
      if (!message.payload) return;
      try {
        state.emitter.emit("event", JSON.parse(message.payload) as RealtimeEvent);
      } catch (error) {
        console.error("Invalid realtime event payload", error);
      }
    });
    client.on("error", (error) => {
      console.error("Realtime database listener disconnected", error);
      state.listener = undefined;
      state.listenerPromise = undefined;
      scheduleReconnect();
    });
    client.on("end", () => {
      state.listener = undefined;
      state.listenerPromise = undefined;
      scheduleReconnect();
    });

    await client.connect();
    await client.query(`LISTEN ${CHANNEL}`);
    state.listener = client;
  })().catch((error) => {
    state.listener = undefined;
    state.listenerPromise = undefined;
    console.error("Unable to start realtime database listener", error);
    scheduleReconnect();
  });

  return state.listenerPromise;
}

export async function subscribeToUserEvents(userId: string, listener: (event: RealtimeEvent) => void) {
  await startListener();

  const handleEvent = (event: RealtimeEvent) => {
    if (event.userIds.includes(userId)) listener(event);
  };

  state.emitter.on("event", handleEvent);
  return () => state.emitter.off("event", handleEvent);
}

export async function publishRealtimeEvent(userIds: string[], type: RealtimeEvent["type"]) {
  const recipients = [...new Set(userIds.filter(Boolean))];
  if (!recipients.length) return;

  const event: RealtimeEvent = {
    userIds: recipients,
    type,
    sentAt: new Date().toISOString(),
  };

  try {
    await db.$queryRaw`SELECT pg_notify(${CHANNEL}, ${JSON.stringify(event)})`;
  } catch (error) {
    console.error("Unable to publish realtime event", error);
  }
}
