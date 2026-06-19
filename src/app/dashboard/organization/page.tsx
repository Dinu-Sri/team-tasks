import { Building2 } from "lucide-react";
import { redirect } from "next/navigation";

import { OrganizationProfileForm } from "@/components/dashboard/organization-profile-form";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function OrganizationPage() {
  const user = await requireUser();
  const memberships = await db.membership.findMany({
    where: {
      userId: user.id,
      status: "ACTIVE",
      role: { in: ["OWNER", "ADMIN"] },
      team: { organizationDomains: { some: { verifiedAt: { not: null } } } },
    },
    include: { team: { include: { organizationDomains: { where: { verifiedAt: { not: null } } } } } },
    orderBy: { createdAt: "asc" },
  });

  const membership = memberships[0];
  if (!membership) redirect("/dashboard/teams");
  const team = membership.team;

  return (
    <div className="space-y-5">
      <header className="border-b border-border pb-5">
        <h1 className="flex items-center gap-2 text-2xl font-semibold"><Building2 className="h-5 w-5 text-brand" />Organization</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage the verified organization identity shown across Tuduvia.</p>
      </header>
      <section className="rounded-lg border border-border bg-surface p-4">
        <p className="text-sm font-semibold">{team.organizationName ?? team.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Verified domain{team.organizationDomains.length === 1 ? "" : "s"}: {team.organizationDomains.map((domain) => domain.domain).join(", ")}
        </p>
      </section>
      <OrganizationProfileForm
        teamId={team.id}
        organizationName={team.organizationName ?? team.name}
        useOrganizationIcon={team.useOrganizationIcon}
        organizationLogo={team.organizationLogo}
      />
    </div>
  );
}
