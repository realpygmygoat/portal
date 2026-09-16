import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-profile";
import { ReminderForm } from "./reminder-form";
import { ChevronMark } from "@/components/chevron-mark";
import type { MemberBalance, Payment } from "@/lib/database.types";

function money(n: number) {
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

interface ChargeRow {
  id: string;
  amount: number;
  billing_periods: { label: string; services: { name: string } | null } | null;
}

export default async function DashboardPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl px-10 py-12">
        <p className="text-sm text-text-muted">
          You&apos;re signed in, but there&apos;s no member profile for your account yet.
          Ask the admin to add you.
        </p>
      </div>
    );
  }

  const supabase = await createClient();

  const [{ data: balanceData }, { data: chargesData }, { data: paymentsData }] = await Promise.all([
    supabase.from("member_balances").select("*").eq("profile_id", profile.id).maybeSingle(),
    supabase
      .from("charges")
      .select("id, amount, billing_periods(label, start_date, end_date, services(name))")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("payments")
      .select("id, amount, paid_at, note")
      .eq("profile_id", profile.id)
      .order("paid_at", { ascending: false }),
  ]);

  const balance = balanceData as MemberBalance | null;
  const charges = chargesData as unknown as ChargeRow[] | null;
  const payments = paymentsData as Payment[] | null;

  const owed = balance?.balance ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-10 py-12">
      <div className="flex items-center gap-2">
        <ChevronMark size={16} />
        <h1 className="text-xl font-semibold text-text">Dashboard</h1>
      </div>

      <section className="rounded-xl border border-rule bg-surface p-6">
        <p className="font-mono text-xs text-text-muted">Your balance</p>
        <p className={`mt-1 font-serif text-4xl font-semibold ${owed > 0 ? "text-red-400" : "text-sage"}`}>
          {money(owed)}
        </p>
        <p className="mt-1 text-sm text-text-muted">
          {owed > 0 ? "You owe this much." : "You're all settled up."}
        </p>

        <div className="mt-4 flex items-center gap-2 border-t border-rule pt-4 text-sm">
          <span className="text-text-muted">Remind me:</span>
          <ReminderForm current={profile.reminder_frequency} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-text">Charges</h2>
        <div className="overflow-hidden rounded-xl border border-rule bg-surface">
          <table className="w-full text-sm">
            <thead className="text-left text-text-muted">
              <tr className="border-b border-rule">
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {charges && charges.length > 0 ? (
                charges.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3 text-text">{c.billing_periods?.services?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-text-muted">{c.billing_periods?.label ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-text">{money(c.amount)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-text-muted">
                    No charges yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-text">Payments</h2>
        <div className="overflow-hidden rounded-xl border border-rule bg-surface">
          <table className="w-full text-sm">
            <thead className="text-left text-text-muted">
              <tr className="border-b border-rule">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Note</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {payments && payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 text-text">{p.paid_at}</td>
                    <td className="px-4 py-3 text-text-muted">{p.note ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-text">{money(p.amount)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-text-muted">
                    No payments recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
