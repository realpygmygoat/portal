import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-profile";
import { ReminderForm } from "./reminder-form";
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
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-sm text-neutral-600">
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
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-neutral-500">Your balance</p>
        <p
          className={`mt-1 text-4xl font-semibold ${owed > 0 ? "text-red-600" : "text-green-600"}`}
        >
          {money(owed)}
        </p>
        <p className="mt-1 text-sm text-neutral-500">
          {owed > 0 ? "You owe this much." : "You're all settled up."}
        </p>

        <div className="mt-4 flex items-center gap-2 border-t border-neutral-100 pt-4 text-sm">
          <span className="text-neutral-600">Remind me:</span>
          <ReminderForm current={profile.reminder_frequency} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">Charges</h2>
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-2 font-medium">Service</th>
                <th className="px-4 py-2 font-medium">Period</th>
                <th className="px-4 py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {charges && charges.length > 0 ? (
                charges.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-2">{c.billing_periods?.services?.name ?? "—"}</td>
                    <td className="px-4 py-2 text-neutral-600">
                      {c.billing_periods?.label ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-right">{money(c.amount)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-neutral-400">
                    No charges yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">Payments</h2>
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Note</th>
                <th className="px-4 py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {payments && payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2">{p.paid_at}</td>
                    <td className="px-4 py-2 text-neutral-600">{p.note ?? "—"}</td>
                    <td className="px-4 py-2 text-right">{money(p.amount)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-neutral-400">
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
