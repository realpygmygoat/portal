import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBalanceReminder } from "@/lib/email";
import type { ReminderFrequency } from "@/lib/database.types";

const FREQUENCY_DAYS: Record<Exclude<ReminderFrequency, "none">, number> = {
  monthly: 28,
  quarterly: 90,
  biannual: 182,
};

function isDue(lastRemindedAt: string | null, frequency: ReminderFrequency, now: Date) {
  if (frequency === "none") return false;
  if (!lastRemindedAt) return true;

  const days = FREQUENCY_DAYS[frequency];
  const last = new Date(lastRemindedAt);
  const diffDays = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= days;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: balances, error } = await supabase.from("member_balances").select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const sent: string[] = [];

  for (const member of balances ?? []) {
    if (member.balance <= 0) continue;
    if (!isDue(member.last_reminded_at, member.reminder_frequency, now)) continue;

    await sendBalanceReminder(member.email, member.full_name, member.balance);
    await supabase
      .from("profiles")
      .update({ last_reminded_at: today })
      .eq("id", member.profile_id);

    sent.push(member.email);
  }

  return NextResponse.json({ checked: balances?.length ?? 0, sent });
}
