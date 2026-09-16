import { createClient } from "@/lib/supabase/server";
import { recordPayment } from "./actions";
import { ChevronMark } from "@/components/chevron-mark";
import type { MemberBalance } from "@/lib/database.types";

function money(n: number) {
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

function StatTile({ label, value, accent }: { label: string; value: string; accent?: "brass" | "sage" }) {
  return (
    <div className="rounded-xl border border-rule bg-surface px-5 py-4">
      <p className="font-mono text-xs tracking-wide text-text-muted">{label}</p>
      <p
        className={`mt-2 font-serif text-2xl font-semibold ${
          accent === "brass" ? "text-brass" : accent === "sage" ? "text-sage" : "text-text"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("member_balances").select("*").order("balance", { ascending: false });
  const balances = (data ?? []) as MemberBalance[];

  const totalOwed = balances.reduce((sum, b) => sum + Math.max(b.balance, 0), 0);
  const totalCollected = balances.reduce((sum, b) => sum + b.total_paid, 0);
  const owingCount = balances.filter((b) => b.balance > 0).length;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <ChevronMark size={16} />
        <h1 className="text-xl font-semibold text-text">Dashboard</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Outstanding" value={money(totalOwed)} accent="brass" />
        <StatTile label="Collected all-time" value={money(totalCollected)} accent="sage" />
        <StatTile label="Members owing" value={`${owingCount} / ${balances.length}`} />
      </div>

      <div className="overflow-hidden rounded-xl border border-rule bg-surface">
        <table className="w-full text-sm">
          <thead className="text-left text-text-muted">
            <tr className="border-b border-rule">
              <th className="px-4 py-3 font-medium">Member</th>
              <th className="px-4 py-3 font-medium">Reminder</th>
              <th className="px-4 py-3 text-right font-medium">Charged</th>
              <th className="px-4 py-3 text-right font-medium">Paid</th>
              <th className="px-4 py-3 text-right font-medium">Balance</th>
              <th className="px-4 py-3 font-medium">Record payment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {balances.map((b) => (
              <tr key={b.profile_id}>
                <td className="px-4 py-3">
                  <div className="font-medium text-text">{b.full_name}</div>
                  <div className="text-xs text-text-muted">{b.email}</div>
                </td>
                <td className="px-4 py-3 text-text-muted">{b.reminder_frequency}</td>
                <td className="px-4 py-3 text-right text-text">{money(b.total_charged)}</td>
                <td className="px-4 py-3 text-right text-text">{money(b.total_paid)}</td>
                <td
                  className={`px-4 py-3 text-right font-medium ${
                    b.balance > 0 ? "text-red-400" : "text-sage"
                  }`}
                >
                  {money(b.balance)}
                </td>
                <td className="px-4 py-3">
                  <form action={recordPayment} className="flex items-center gap-1">
                    <input type="hidden" name="profile_id" value={b.profile_id} />
                    <input type="hidden" name="paid_at" value={today} />
                    <input
                      type="number"
                      step="0.01"
                      name="amount"
                      placeholder="0.00"
                      className="w-20 rounded-md border border-rule bg-ink px-2 py-1 text-xs text-text outline-none focus:border-brass"
                    />
                    <button
                      type="submit"
                      className="rounded-md bg-brass px-2 py-1 text-xs font-medium text-ink hover:opacity-90"
                    >
                      Save
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {balances.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                  No members yet — add one from the Members tab.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
