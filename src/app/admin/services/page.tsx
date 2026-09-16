import { createClient } from "@/lib/supabase/server";
import { addService, addBillingPeriod } from "../actions";
import { GroupMemberPicker } from "./group-member-picker";
import { ChevronMark } from "@/components/chevron-mark";
import type { Service, Group } from "@/lib/database.types";

interface BillingPeriodRow {
  id: string;
  label: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  services: { name: string } | null;
}

interface GroupMemberRow {
  group_id: string;
  profile_id: string;
}

function money(n: number) {
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

export default async function ServicesPage() {
  const supabase = await createClient();

  const [{ data: servicesData }, { data: membersData }, { data: periodsData }, { data: groupsData }, { data: groupMembersData }] =
    await Promise.all([
      supabase.from("services").select("*").order("name"),
      supabase.from("profiles").select("id, full_name").order("full_name"),
      supabase
        .from("billing_periods")
        .select("id, label, start_date, end_date, total_amount, services(name)")
        .order("start_date", { ascending: false }),
      supabase.from("groups").select("*").order("name"),
      supabase.from("group_members").select("group_id, profile_id"),
    ]);

  const services = (servicesData ?? []) as Service[];
  const members = (membersData ?? []) as { id: string; full_name: string }[];
  const periods = (periodsData ?? []) as unknown as BillingPeriodRow[];
  const groups = (groupsData ?? []) as Group[];
  const groupMembers = (groupMembersData ?? []) as GroupMemberRow[];

  const groupOptions = groups.map((g) => ({
    id: g.id,
    name: g.name,
    memberIds: groupMembers.filter((m) => m.group_id === g.id).map((m) => m.profile_id),
  }));

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <ChevronMark size={16} />
          <h1 className="text-xl font-semibold text-text">Services</h1>
        </div>
        <p className="mt-2 text-sm text-text-muted">
          Add a service once, then log each billing period (a price change, or people
          joining/leaving) as a new period — the cost splits evenly across whoever you select.
        </p>
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <form action={addService} className="space-y-2 rounded-xl border border-rule bg-surface p-5">
          <h2 className="text-sm font-semibold text-text">Add a service</h2>
          <input
            name="name"
            required
            placeholder="e.g. Spotify Family"
            className="w-full rounded-md border border-rule bg-ink px-2 py-1.5 text-sm text-text outline-none focus:border-brass"
          />
          <button
            type="submit"
            className="rounded-md bg-brass px-3 py-1.5 text-sm font-medium text-ink hover:opacity-90"
          >
            Add service
          </button>
        </form>

        <div className="rounded-xl border border-rule bg-surface p-5">
          <h2 className="text-sm font-semibold text-text">Existing services</h2>
          <ul className="mt-2 space-y-1 text-sm text-text-muted">
            {services.map((s) => (
              <li key={s.id}>{s.name}</li>
            ))}
            {services.length === 0 && <li className="text-text-muted">None yet.</li>}
          </ul>
        </div>
      </section>

      <section className="rounded-xl border border-rule bg-surface p-5">
        <h2 className="text-sm font-semibold text-text">Add a billing period</h2>
        <form action={addBillingPeriod} className="mt-3 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block font-mono text-xs text-text-muted">Service</label>
              <select
                name="service_id"
                required
                className="mt-1 w-full rounded-md border border-rule bg-ink px-2 py-1.5 text-sm text-text outline-none focus:border-brass"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-mono text-xs text-text-muted">Label</label>
              <input
                name="label"
                required
                placeholder="e.g. Nov 2025 - Oct 2026 (12 months)"
                className="mt-1 w-full rounded-md border border-rule bg-ink px-2 py-1.5 text-sm text-text outline-none focus:border-brass"
              />
            </div>
            <div>
              <label className="block font-mono text-xs text-text-muted">Start date</label>
              <input
                type="date"
                name="start_date"
                required
                className="mt-1 w-full rounded-md border border-rule bg-ink px-2 py-1.5 text-sm text-text outline-none focus:border-brass"
              />
            </div>
            <div>
              <label className="block font-mono text-xs text-text-muted">End date</label>
              <input
                type="date"
                name="end_date"
                required
                className="mt-1 w-full rounded-md border border-rule bg-ink px-2 py-1.5 text-sm text-text outline-none focus:border-brass"
              />
            </div>
            <div>
              <label className="block font-mono text-xs text-text-muted">Total cost (tax inc.)</label>
              <input
                type="number"
                step="0.01"
                name="total_amount"
                required
                className="mt-1 w-full rounded-md border border-rule bg-ink px-2 py-1.5 text-sm text-text outline-none focus:border-brass"
              />
            </div>
          </div>

          <GroupMemberPicker groups={groupOptions} members={members} />

          <button
            type="submit"
            className="rounded-md bg-brass px-3 py-1.5 text-sm font-medium text-ink hover:opacity-90"
          >
            Add period & split cost
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-text">Billing history</h2>
        <div className="overflow-hidden rounded-xl border border-rule bg-surface">
          <table className="w-full text-sm">
            <thead className="text-left text-text-muted">
              <tr className="border-b border-rule">
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 font-medium">Dates</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {periods.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-text">{p.services?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-text-muted">{p.label}</td>
                  <td className="px-4 py-3 text-text-muted">
                    {p.start_date} → {p.end_date}
                  </td>
                  <td className="px-4 py-3 text-right text-text">{money(p.total_amount)}</td>
                </tr>
              ))}
              {periods.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-text-muted">
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
