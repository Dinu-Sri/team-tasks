import { redirect } from "next/navigation";

import { logoutAction } from "@/app/actions/auth";
import { acceptInviteAction } from "@/app/actions/teams";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await db.invite.findUnique({ where: { token }, include: { team: true, invitedBy: true } });
  if (!invite || invite.status !== "PENDING" || invite.expiresAt < new Date()) redirect("/login");
  const user = await getSessionUser();

  if (!user) redirect(`/signup?email=${encodeURIComponent(invite.email)}`);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <section className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-semibold">Join {invite.team.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{invite.invitedBy.name} invited {invite.email}.</p>
        {user.email === invite.email ? (
          <form action={acceptInviteAction} className="mt-6">
            <input type="hidden" name="token" value={token} />
            <Button className="w-full" size="lg">Accept invitation</Button>
          </form>
        ) : (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-danger">Log in with {invite.email} to accept.</p>
            <form action={logoutAction}>
              <Button className="w-full" variant="secondary">Use another account</Button>
            </form>
          </div>
        )}
      </section>
    </main>
  );
}
