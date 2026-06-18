"use client";

import { useActionState } from "react";
import { Check, ShieldCheck, Trash2, UserCheck, UserX } from "lucide-react";

import {
  approveDomainMemberAction,
  claimOrganizationDomainAction,
  rejectDomainMemberAction,
  removeOrganizationDomainAction,
  updateOrganizationDomainSettingsAction,
  verifyOrganizationDomainDnsAction,
} from "@/app/actions/organization-domains";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DomainInfo = {
  id: string;
  domain: string;
  autoJoin: boolean;
  requireAdminApproval: boolean;
  dnsTxtName: string | null;
  dnsTxtValue: string | null;
  pendingVerification: boolean;
};

type PendingMember = {
  userId: string;
  name: string;
  email: string;
  createdAt: string;
};

export function OrganizationAccessPanel({
  teamId,
  teamName,
  owner,
  domains,
  pendingMembers,
}: {
  teamId: string;
  teamName: string;
  owner: boolean;
  domains: DomainInfo[];
  pendingMembers: PendingMember[];
}) {
  if (!owner) {
    return (
      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-brand" />Organization access</h2>
        <p className="mt-2 text-sm text-muted-foreground">Only the workspace owner can claim organization domains and approve domain-based access.</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-surface">
      <div className="border-b border-border px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-brand" />Organization access</h2>
        <p className="mt-1 text-xs text-muted-foreground">Claim a verified organization domain so matching users can join this workspace with minimum clicks.</p>
      </div>
      <div className="space-y-5 p-4">
        <ClaimDomainForm teamId={teamId} />
        {domains.length ? (
          <div className="space-y-3">
            {domains.map((domain) => (
              <DomainSettingsForm key={domain.id} teamName={teamName} domain={domain} />
            ))}
          </div>
        ) : (
          <p className="rounded-lg bg-surface-subtle p-3 text-sm text-muted-foreground">No organization domain is connected to this workspace yet.</p>
        )}
        <PendingDomainMembers teamId={teamId} pendingMembers={pendingMembers} />
      </div>
    </section>
  );
}

function ClaimDomainForm({ teamId }: { teamId: string }) {
  const [state, action, pending] = useActionState(claimOrganizationDomainAction, {});

  return (
    <form action={action} className="space-y-3 rounded-lg bg-surface-subtle p-3">
      <input type="hidden" name="teamId" value={teamId} />
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label htmlFor="organization-domain" className="mb-1 block text-xs font-medium uppercase text-muted-foreground">Domain</label>
          <Input id="organization-domain" name="domain" placeholder="acme.org" required />
        </div>
        <div>
          <label htmlFor="verification-email" className="mb-1 block text-xs font-medium uppercase text-muted-foreground">Admin email</label>
          <Input id="verification-email" name="verificationEmail" type="email" placeholder="admin@acme.org" />
        </div>
      </div>
      <div className="grid gap-2 min-[520px]:grid-cols-2">
        <label className="flex min-h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm">
          <input name="verificationMethod" type="radio" value="email" defaultChecked />
          Verify by admin email
        </label>
        <label className="flex min-h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm">
          <input name="verificationMethod" type="radio" value="dns" />
          Verify by DNS TXT
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input name="requireAdminApproval" type="checkbox" defaultChecked className="h-4 w-4 rounded border-border" />
        Require owner approval before domain users join
      </label>
      {state.error ? <p className="text-xs text-danger">{state.error}</p> : null}
      {state.success ? <p className="text-xs text-success">{state.success}</p> : null}
      <Button disabled={pending} type="submit"><ShieldCheck />{pending ? "Claiming" : "Claim domain"}</Button>
    </form>
  );
}

function DomainSettingsForm({ domain, teamName }: { domain: DomainInfo; teamName: string }) {
  const [state, action, pending] = useActionState(updateOrganizationDomainSettingsAction, {});
  const [dnsState, dnsAction, dnsPending] = useActionState(verifyOrganizationDomainDnsAction, {});

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex flex-col gap-2 min-[520px]:flex-row min-[520px]:items-start min-[520px]:justify-between">
        <div>
          <p className="text-sm font-semibold">{domain.domain}</p>
          <p className="text-xs text-muted-foreground">
            {domain.pendingVerification ? `Waiting for domain verification before ${teamName} can use this domain.` : "Verified for organization access."}
          </p>
        </div>
        {!domain.pendingVerification ? <span className="inline-flex w-fit items-center gap-1 rounded-full bg-brand/10 px-2 py-1 text-xs font-medium text-brand"><Check className="h-3.5 w-3.5" />Verified</span> : null}
      </div>

      <div className="mt-3 space-y-3">
        {domain.pendingVerification && domain.dnsTxtName && domain.dnsTxtValue ? (
          <div className="rounded-lg bg-surface-subtle p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">DNS TXT verification</p>
            <p className="mt-2">Name</p>
            <code className="mt-1 block overflow-x-auto rounded-md bg-background px-2 py-1 text-foreground">{domain.dnsTxtName}</code>
            <p className="mt-2">Value</p>
            <code className="mt-1 block overflow-x-auto rounded-md bg-background px-2 py-1 text-foreground">{domain.dnsTxtValue}</code>
            <form action={dnsAction} className="mt-3 space-y-2">
              <input type="hidden" name="domainId" value={domain.id} />
              {dnsState.error ? <p className="text-xs text-danger">{dnsState.error}</p> : null}
              {dnsState.success ? <p className="text-xs text-success">{dnsState.success}</p> : null}
              <Button type="submit" size="sm" disabled={dnsPending}>Verify DNS</Button>
            </form>
          </div>
        ) : null}
        <form action={action} className="space-y-3">
          <input type="hidden" name="domainId" value={domain.id} />
          <label className="flex items-center gap-2 text-sm">
            <input name="autoJoin" type="checkbox" defaultChecked={domain.autoJoin} disabled={domain.pendingVerification} className="h-4 w-4 rounded border-border" />
            Route verified {domain.domain} users to this workspace
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input name="requireAdminApproval" type="checkbox" defaultChecked={domain.requireAdminApproval} disabled={domain.pendingVerification} className="h-4 w-4 rounded border-border" />
            Require owner approval before joining
          </label>
          {state.error ? <p className="text-xs text-danger">{state.error}</p> : null}
          {state.success ? <p className="text-xs text-success">{state.success}</p> : null}
          <Button type="submit" size="sm" variant="secondary" disabled={pending || domain.pendingVerification}>Save access rules</Button>
        </form>
        <form action={removeOrganizationDomainAction}>
          <input type="hidden" name="domainId" value={domain.id} />
          <Button type="submit" size="sm" variant="quiet"><Trash2 />Remove</Button>
        </form>
      </div>
    </div>
  );
}

function PendingDomainMembers({ teamId, pendingMembers }: { teamId: string; pendingMembers: PendingMember[] }) {
  return (
    <div>
      <h3 className="text-xs font-medium uppercase text-muted-foreground">Pending domain users</h3>
      {pendingMembers.length ? (
        <div className="mt-2 divide-y divide-border rounded-lg border border-border">
          {pendingMembers.map((member) => (
            <div key={member.userId} className="flex flex-col gap-3 px-3 py-3 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{member.name}</p>
                <p className="truncate text-xs text-muted-foreground">{member.email}</p>
              </div>
              <div className="flex gap-2">
                <form action={approveDomainMemberAction}>
                  <input type="hidden" name="teamId" value={teamId} />
                  <input type="hidden" name="userId" value={member.userId} />
                  <Button type="submit" size="sm"><UserCheck />Approve</Button>
                </form>
                <form action={rejectDomainMemberAction}>
                  <input type="hidden" name="teamId" value={teamId} />
                  <input type="hidden" name="userId" value={member.userId} />
                  <Button type="submit" size="sm" variant="quiet"><UserX />Reject</Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 rounded-lg bg-surface-subtle p-3 text-sm text-muted-foreground">No domain users are waiting for approval.</p>
      )}
    </div>
  );
}
