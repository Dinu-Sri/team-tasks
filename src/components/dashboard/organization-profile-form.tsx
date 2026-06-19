"use client";

import { useActionState } from "react";
import { Building2, ImageUp } from "lucide-react";
import Image from "next/image";

import { updateOrganizationProfileAction } from "@/app/actions/organization-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function OrganizationProfileForm({
  teamId,
  organizationName,
  useOrganizationIcon,
  organizationLogo,
}: {
  teamId: string;
  organizationName: string;
  useOrganizationIcon: boolean;
  organizationLogo?: string | null;
}) {
  const [state, action, pending] = useActionState(updateOrganizationProfileAction, {});
  const logoSrc = organizationLogo ? `/api/organization-logo/${teamId}?v=${encodeURIComponent(organizationLogo)}` : null;

  return (
    <form action={action} encType="multipart/form-data" className="space-y-5 rounded-lg border border-border bg-surface p-4">
      <input type="hidden" name="teamId" value={teamId} />
      <div>
        <label htmlFor="organizationName" className="mb-1 block text-sm font-medium">Organization name</label>
        <Input id="organizationName" name="organizationName" defaultValue={organizationName} placeholder="Acme Learning Center" required />
      </div>
      <div>
        <label htmlFor="logo" className="mb-1 block text-sm font-medium">Organization logo</label>
        {logoSrc ? (
          <div className="mb-3 flex items-center gap-3 rounded-lg bg-surface-subtle p-3">
            <Image src={logoSrc} alt="" width={48} height={48} className="h-12 w-12 rounded-full object-cover" unoptimized />
            <div className="min-w-0">
              <p className="text-sm font-medium">Current logo</p>
              <p className="truncate text-xs text-muted-foreground">{organizationLogo}</p>
            </div>
          </div>
        ) : null}
        <Input id="logo" name="logo" type="file" accept="image/png,image/jpeg,image/webp" className="pt-2" />
        <p className="mt-1 text-xs text-muted-foreground">Recommended: square PNG, JPG, or WebP, 512 x 512 px, under 1 MB.</p>
      </div>
      <label className="flex items-center gap-2 rounded-lg bg-surface-subtle p-3 text-sm">
        <input name="useOrganizationIcon" type="checkbox" defaultChecked={useOrganizationIcon} className="h-4 w-4 rounded border-border" />
        <span className="inline-flex items-center gap-2"><Building2 className="h-4 w-4 text-brand" />Use organization identity in the task header</span>
      </label>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-success">{state.success}</p> : null}
      <Button type="submit" disabled={pending}><ImageUp />{pending ? "Saving" : "Save organization profile"}</Button>
    </form>
  );
}
