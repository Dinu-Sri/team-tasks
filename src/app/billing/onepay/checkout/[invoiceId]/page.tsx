import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createOnePayCheckout, onePayConfigured } from "@/lib/onepay";

export default async function OnePayCheckoutPage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const user = await requireUser();
  const { invoiceId } = await params;
  if (!onePayConfigured()) redirect("/dashboard/billing?payment=onepay-not-configured");

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

  const checkout = await createOnePayCheckout({ invoice, plan: invoice.plan, user });
  if (!checkout.ok) {
    redirect(`/dashboard/billing?payment=onepay-error&reason=${encodeURIComponent(checkout.error)}`);
  }

  if (checkout.transactionId) {
    await db.invoice.update({
      where: { id: invoice.id },
      data: { providerPaymentId: checkout.transactionId },
    });
  }

  redirect(checkout.redirectUrl);
}
