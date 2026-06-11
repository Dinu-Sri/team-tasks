"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function markNotificationsReadAction() {
  const user = await requireUser();
  await db.notification.updateMany({
    where: { recipientId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
}
