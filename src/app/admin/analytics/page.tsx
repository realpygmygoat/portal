import { createClient } from "@/lib/supabase/server";
import { ChevronMark } from "@/components/chevron-mark";
import { MonthlyCollectedChart, ServiceBreakdownChart } from "./charts";

function money(n: number) {
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

function monthLabel(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-CA", { month: "short", year: "2-digit" });
}

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const [{ data: paymentsData }, { data: chargesData }] = await Promise.all([
    supabase.from("payments").select("amount, paid_at").order("paid_at", { ascending: true }),
    supabase
      .from("charges")
      .select("amount, billing_periods(services(name))")
      .returns<{ amount: number; billing_periods: { services: { name: string } | null } | null }[]>(),
  ]);

  const payments = (paymentsData ?? []) as { amount: number; paid_at: string }[];

  const byMonth = new Map<string, number>();
  for (const p of payments) {
    const key = p.paid_at.slice(0, 7); // YYYY-MM
    byMonth.set(key, (byMonth.get(key) ?? 0) + p.amount);
  }
  const monthlyData = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, amount]) => ({ label: monthLabel(key), amount }));

  const byService = new Map<string, number>();
  for (const c of chargesData ?? []) {
    const name = c.billing_periods?.services?.name ?? "Unknown";
    byService.set(name, (byService.get(name) ?? 0) + c.amount);
  }
  const serviceData = [...byService.entries()]
    .sort(([, a], [, b]) => b - a)
    .map(([label, amount]) => ({ label, amount }));

  const totalCollected = payments.reduce((s, p) => s + p.amount, 0);
  const totalCharged = serviceData.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <ChevronMark size={16} />
        <h1 className="text-xl font-semibold text-text">Analytics</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-rule bg-surface px-5 py-4">
          <p className="font-mono text-xs text-text-muted">Total collected</p>
          <p className="mt-2 font-serif text-2xl font-semibold text-sage">{money(totalCollected)}</p>
        </div>
        <div className="rounded-xl border border-rule bg-surface px-5 py-4">
          <p className="font-mono text-xs text-text-muted">Total charged</p>
          <p className="mt-2 font-serif text-2xl font-semibold text-brass">{money(totalCharged)}</p>
        </div>
      </div>

      <section className="rounded-xl border border-rule bg-surface p-5">
        <h2 className="text-sm font-semibold text-text">Payments collected per month</h2>
        <div className="mt-4">
          <MonthlyCollectedChart data={monthlyData} />
        </div>
      </section>

      <section className="rounded-xl border border-rule bg-surface p-5">
        <h2 className="text-sm font-semibold text-text">Total charged by service</h2>
        <div className="mt-4">
          <ServiceBreakdownChart data={serviceData} />
        </div>
      </section>
    </div>
  );
}
