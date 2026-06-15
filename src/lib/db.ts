import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Lazy-initialized to avoid "Cannot access before initialization" errors
// in Next.js 15 server bundles when module init order conflicts with PrismaClient.
function getDb(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}

// Export a Proxy that lazily delegates to the real PrismaClient.
// This ensures no PrismaClient is instantiated at module load time.
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getDb();
    const value = (client as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
}) as PrismaClient;
