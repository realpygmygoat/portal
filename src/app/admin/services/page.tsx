import { createClient } from "@/lib/supabase/server";
import { addService, addBillingPeriod } from "../actions";

function money(n: number) {
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

export default async function ServicesPage() {
  const supabase = await createClient();

  const [{ data: services }, { data: members }, { data: periods }] = await Promise.all([
    supabase.from("services").select("*").order("name"),
    supabase.from("profiles").select("id, full_name").order("full_name"),
    supabase
      .from("billing_periods")
      .select("id, label, start_date, end_date, total_amount, services(name)")
      .order("start_date", { ascending: false })
      .returns<
        {
          id: string;
          label: string;
          start_date: string;
          end_date: string;
          total_amount: number;
          services: { name: string } | null;
        }[]
      >(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Services & billing</h1>
        <p className="text-sm text-neutral-500">
          Add a service once, then log each billing period (a price change, or people
          joining/leaving) as a new period — the cost splits evenly across whoever you select.
        </p>
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <form
          action={addService}
          className="space-y-2 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-neutral-900">Add a service</h2>
          <input
            name="name"
            required
            placeholder="e.g. Spotify Family"
            className="w-full rounded-md border border-neutral-300 px-2 py-1 text-sm outline-none focus:border-neutral-500"
          />
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700"
          >
            Add service
          </button>
        </form>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-neutral-900">Existing services</h2>
          <ul className="mt-2 space-y-1 text-sm text-neutral-600">
            {(services ?? []).map((s) => (
              <li key={s.id}>{s.name}</li>
            ))}
            {(!services || services.length === 0) && (
              <li className="text-neutral-400">None yet.</li>
            )}
          </ul>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-900">Add a billing period</h2>
        <form action={addBillingPeriod} className="mt-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-neutral-500">Service</label>
              <select
                name="service_id"
                required
                className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1 text-sm outline-none focus:border-neutral-500"
              >
                {(services ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-neutral-500">Label</label>
              <input
                name="label"
                required
                placeholder="e.g. Nov 2025 - Oct 2026 (12 months)"
                className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1 text-sm outline-none focus:border-neutral-500"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500">Start date</label>
              <input
                type="date"
                name="start_date"
                required
                className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1 text-sm outline-none focus:border-neutral-500"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500">End date</label>
              <input
                type="date"
                name="end_date"
                required
                className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1 text-sm outline-none focus:border-neutral-500"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500">Total cost (tax inc.)</label>
              <input
                type="number"
                step="0.01"
                name="total_amount"
                required
                className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1 text-sm outline-none focus:border-neutral-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-neutral-500">Split between</label>
            <div className="mt-1 flex flex-wrap gap-3">
              {(members ?? []).map((m) => (
                <label key={m.id} className="flex items-center gap-1.5 text-sm text-neutral-700">
                  <input type="checkbox" name="member_ids" value={m.id} />
                  {m.full_name}
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700"
          >
            Add period & split cost
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">Billing history</h2>
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-2 font-medium">Service</th>
                <th className="px-4 py-2 font-medium">Period</th>
                <th className="px-4 py-2 font-medium">Dates</th>
                <th className="px-4 py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {(periods ?? []).map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-2">{p.services?.name ?? "—"}</td>
                  <td className="px-4 py-2 text-neutral-600">{p.label}</td>
                  <td className="px-4 py-2 text-neutral-500">
                    {p.start_date} → {p.end_date}
                  </td>
                  <td className="px-4 py-2 text-right">{money(p.total_amount)}</td>
                </tr>
              ))}
              {(!periods || periods.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-neutral-400">
                    No billing periods yet.
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
