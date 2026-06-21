import { redirect } from "next/navigation";

import { PayHereAutoSubmit } from "@/components/billing/payhere-auto-submit";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildRecurringCheckoutPayload, payHereConfigured } from "@/lib/payhere";

export default async function PayHereCheckoutPage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const user = await requireUser();
  const { invoiceId } = await params;
  if (!payHereConfigured()) redirect("/dashboard/billing?payment=payhere-not-configured");

  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      plan: true,
      team: {
        include: {
          memberships: {
            where: { userId: user.id, status: "ACTIVE", role: { in: ["OWNER", "ADMIN"] } },
            select: { id: true },
          },
        },
      },
    },
  });

  if (!invoice || !invoice.plan || invoice.status === "VOID") redirect("/dashboard/billing?payment=invalid");
  if (!invoice.team.memberships.length) redirect("/dashboard/billing?payment=forbidden");
  if (invoice.status === "PAID") redirect("/dashboard/billing?payment=already-paid");

  const checkout = buildRecurringCheckoutPayload({ invoice, plan: invoice.plan, user });

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-soft">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Secure checkout</p>
        <h1 className="mt-2 text-2xl font-semibold">Redirecting to PayHere</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          We are opening PayHere to authorize your Tuduvia subscription. Your plan changes only after PayHere sends a verified payment notification back to Tuduvia.
        </p>
        <div className="mt-5 rounded-lg border border-border bg-background p-3 text-sm">
          <p className="font-medium">{invoice.description}</p>
          <p className="mt-1 text-muted-foreground">Invoice {invoice.number} - LKR {invoice.amountLkr.toLocaleString()}</p>
        </div>
        <PayHereAutoSubmit actionUrl={checkout.actionUrl} fields={checkout.fields} />
      </section>
    </main>
  );
}
