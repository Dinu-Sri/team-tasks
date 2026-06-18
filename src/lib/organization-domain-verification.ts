import { createHash } from "crypto";

import { db } from "@/lib/db";

export function domainTokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function verifyOrganizationDomainToken(token: string) {
  const verification = await db.verification.findFirst({
    where: {
      identifier: `organization-domain:${domainTokenHash(token)}`,
      expiresAt: { gt: new Date() },
    },
  });
  if (!verification) return null;

  const domain = await db.organizationDomain.update({
    where: { id: verification.value },
    data: { autoJoin: true, verifiedAt: new Date() },
    include: { team: true },
  });
  await db.verification.deleteMany({ where: { value: domain.id, identifier: { startsWith: "organization-domain:" } } });
  return domain;
}
