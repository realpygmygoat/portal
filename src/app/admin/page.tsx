import { createClient } from "@/lib/supabase/server";
import { recordPayment } from "./actions";

function money(n: number) {
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const { data: balances } = await supabase
    .from("member_balances")
    .select("*")
    .order("balance", { ascending: false });

  const totalOwed = (balances ?? []).reduce((sum, b) => sum + Math.max(b.balance, 0), 0);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Overview</h1>
        <p className="text-sm text-neutral-500">
          {money(totalOwed)} outstanding across {balances?.length ?? 0} members.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Member</th>
              <th className="px-4 py-2 font-medium">Reminder</th>
              <th className="px-4 py-2 text-right font-medium">Charged</th>
              <th className="px-4 py-2 text-right font-medium">Paid</th>
              <th className="px-4 py-2 text-right font-medium">Balance</th>
              <th className="px-4 py-2 font-medium">Record payment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {(balances ?? []).map((b) => (
              <tr key={b.profile_id}>
                <td className="px-4 py-2">
                  <div className="font-medium text-neutral-900">{b.full_name}</div>
                  <div className="text-xs text-neutral-400">{b.email}</div>
                </td>
                <td className="px-4 py-2 text-neutral-600">{b.reminder_frequency}</td>
                <td className="px-4 py-2 text-right">{money(b.total_charged)}</td>
                <td className="px-4 py-2 text-right">{money(b.total_paid)}</td>
                <td
                  className={`px-4 py-2 text-right font-medium ${
                    b.balance > 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {money(b.balance)}
                </td>
                <td className="px-4 py-2">
                  <form action={recordPayment} className="flex items-center gap-1">
                    <input type="hidden" name="profile_id" value={b.profile_id} />
                    <input type="hidden" name="paid_at" value={today} />
                    <input
                      type="number"
                      step="0.01"
                      name="amount"
                      placeholder="0.00"
                      className="w-20 rounded-md border border-neutral-300 px-2 py-1 text-xs outline-none focus:border-neutral-500"
                    />
                    <button
                      type="submit"
                      className="rounded-md bg-neutral-900 px-2 py-1 text-xs font-medium text-white hover:bg-neutral-700"
                    >
                      Save
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
