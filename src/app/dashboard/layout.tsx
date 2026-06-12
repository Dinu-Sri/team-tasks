import type { ReactNode } from "react";

import { AppHeader } from "@/components/app-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getHeaderData } from "@/lib/header-data";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const [headerData, capabilities] = await Promise.all([
    getHeaderData(user.id),
    db.membership.findMany({
      where: { userId: user.id },
      select: { team: { select: { featureSettings: true } } },
    }),
  ]);
  const commentsEnabled = capabilities.some(({ team }) => team.featureSettings?.commentsEnabled);
  const attachmentsEnabled = capabilities.some(({ team }) => team.featureSettings?.attachmentsEnabled);

  return (
    <main className="min-h-screen bg-background">
      <AppHeader user={user} {...headerData} />
      <DashboardShell commentsEnabled={commentsEnabled} attachmentsEnabled={attachmentsEnabled}>
        {children}
      </DashboardShell>
    </main>
  );
}
