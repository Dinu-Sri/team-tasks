"use server";

import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadDirectory } from "@/lib/attachments";

export type OrganizationProfileState = { error?: string; success?: string };

const LOGO_TYPES = new Map([
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
  ["image/webp", ".webp"],
]);

export async function updateOrganizationProfileAction(_: OrganizationProfileState, formData: FormData): Promise<OrganizationProfileState> {
  const user = await requireUser();
  const teamId = String(formData.get("teamId") ?? "");
  const organizationName = String(formData.get("organizationName") ?? "").trim();
  const useOrganizationIcon = formData.get("useOrganizationIcon") === "on";
  const logo = formData.get("logo");

  if (organizationName.length < 2) return { error: "Enter the organization name." };

  const membership = await db.membership.findUnique({
    where: { userId_teamId: { userId: user.id, teamId } },
    include: { team: { include: { organizationDomains: true } } },
  });
  if (!membership || membership.status !== "ACTIVE" || !["OWNER", "ADMIN"].includes(membership.role)) {
    return { error: "Only an organization owner or admin can update this profile." };
  }
  if (!membership.team.organizationDomains.some((domain) => domain.verifiedAt)) {
    return { error: "Verify an organization domain before editing the organization profile." };
  }

  let organizationLogo: string | undefined;
  if (logo instanceof File && logo.size > 0) {
    const extension = LOGO_TYPES.get(logo.type.toLowerCase());
    if (!extension) return { error: "Use a PNG, JPG, or WebP logo." };
    if (logo.size > 1024 * 1024) return { error: "Keep the logo under 1 MB." };

    const directory = uploadDirectory();
    await mkdir(directory, { recursive: true });
    organizationLogo = `org-logo-${randomUUID()}${extension}`;
    await writeFile(path.join(directory, organizationLogo), new Uint8Array(await logo.arrayBuffer()), { flag: "wx" });

    if (membership.team.organizationLogo) {
      await unlink(path.join(directory, path.basename(membership.team.organizationLogo))).catch(() => undefined);
    }
  }

  await db.team.update({
    where: { id: teamId },
    data: {
      organizationName,
      useOrganizationIcon,
      ...(organizationLogo ? { organizationLogo } : {}),
    },
  });

  revalidatePath("/");
  revalidatePath("/dashboard", "layout");
  return { success: "Organization profile updated." };
}
