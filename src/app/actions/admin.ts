"use server";

import { revalidatePath } from "next/cache";
import { unlink } from "fs/promises";
import path from "path";

import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadDirectory } from "@/lib/attachments";

export type AdminState = { error?: string; success?: string };

export async function suspendUserSubmitAction(formData: FormData) {
  await suspendUserAction({}, formData);
}

export async function deleteUserSubmitAction(formData: FormData) {
  await deleteUserAction({}, formData);
}

export async function unsuspendUserSubmitAction(formData: FormData) {
  await unsuspendUserAction({}, formData);
}

export async function suspendUserAction(_: AdminState, formData: FormData): Promise<AdminState> {
  const admin = await requireSuperAdmin();
  const targetUserId = String(formData.get("userId") ?? "").trim();
  if (!targetUserId) return { error: "User ID is required." };
  if (targetUserId === admin.id) return { error: "You cannot suspend yourself." };

  const target = await db.user.findUnique({ where: { id: targetUserId }, select: { id: true, email: true, name: true } });
  if (!target) return { error: "User not found." };

  await db.user.update({ where: { id: targetUserId }, data: { passwordHash: `__SUSPENDED__${Date.now()}` } });

  await db.productEvent.create({
    data: {
      name: "admin.user_suspended",
      userId: targetUserId,
      properties: { suspendedById: admin.id, suspendedByName: admin.name },
    },
  });

  revalidatePath("/dashboard/admin");
  return { success: `${target.name} has been suspended.` };
}

export async function deleteUserAction(_: AdminState, formData: FormData): Promise<AdminState> {
  const admin = await requireSuperAdmin();
  const targetUserId = String(formData.get("userId") ?? "").trim();
  if (!targetUserId) return { error: "User ID is required." };
  if (targetUserId === admin.id) return { error: "You cannot delete yourself." };

  const target = await db.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      name: true,
      uploadedAttachments: { select: { storedName: true } },
    },
  });
  if (!target) return { error: "User not found." };

  // Delete physical files from disk
  const uploadDir = uploadDirectory();
  for (const attachment of target.uploadedAttachments) {
    try {
      await unlink(path.join(uploadDir, path.basename(attachment.storedName)));
    } catch {
      // File already gone; safe to ignore.
    }
  }

  // Cascade delete the user (Prisma schema has onDelete: Cascade for all relations)
  await db.user.delete({ where: { id: targetUserId } });

  await db.productEvent.create({
    data: {
      name: "admin.user_deleted",
      userId: admin.id,
      properties: { deletedUserId: targetUserId, deletedUserName: target.name },
    },
  });

  revalidatePath("/dashboard/admin");
  return { success: `${target.name} has been permanently deleted.` };
}

export async function unsuspendUserAction(_: AdminState, formData: FormData): Promise<AdminState> {
  const admin = await requireSuperAdmin();
  const targetUserId = String(formData.get("userId") ?? "").trim();
  if (!targetUserId) return { error: "User ID is required." };

  const target = await db.user.findUnique({ where: { id: targetUserId }, select: { id: true, passwordHash: true, name: true } });
  if (!target) return { error: "User not found." };
  if (!target.passwordHash.startsWith("__SUSPENDED__")) return { error: "This user is not suspended." };

  await db.user.update({ where: { id: targetUserId }, data: { passwordHash: `__REINSTATED__${Date.now()}` } });

  revalidatePath("/dashboard/admin");
  return { success: `${target.name} has been unsuspended. They will need to reset their password.` };
}
