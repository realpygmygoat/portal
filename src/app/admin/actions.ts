"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-profile";
import type { ReminderFrequency } from "@/lib/database.types";

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile?.is_admin) throw new Error("Not authorized");
  return profile;
}

export async function recordPayment(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const profile_id = String(formData.get("profile_id"));
  const amount = Number(formData.get("amount"));
  const paid_at = String(formData.get("paid_at") || new Date().toISOString().slice(0, 10));
  const note = String(formData.get("note") || "") || null;

  if (!profile_id || !amount || amount <= 0) return;

  await supabase.from("payments").insert({
    profile_id,
    amount,
    paid_at,
    note,
    recorded_by: admin.id,
  });

  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

export async function addMember(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const full_name = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const reminder_frequency = String(formData.get("reminder_frequency") || "monthly") as ReminderFrequency;

  if (!full_name || !email) return;

  await supabase.from("profiles").insert({ full_name, email, reminder_frequency });

  revalidatePath("/admin/members");
}

export async function updateMemberReminder(profile_id: string, reminder_frequency: ReminderFrequency) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("profiles").update({ reminder_frequency }).eq("id", profile_id);
  revalidatePath("/admin/members");
}

export async function removeMember(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const id = String(formData.get("profile_id"));
  await supabase.from("profiles").delete().eq("id", id);
  revalidatePath("/admin/members");
}

export async function addService(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  await supabase.from("services").insert({ name });
  revalidatePath("/admin/services");
}

export async function addBillingPeriod(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const service_id = String(formData.get("service_id"));
  const label = String(formData.get("label") || "").trim();
  const start_date = String(formData.get("start_date"));
  const end_date = String(formData.get("end_date"));
  const total_amount = Number(formData.get("total_amount"));
  const memberIds = formData.getAll("member_ids").map(String);

  if (!service_id || !label || !start_date || !end_date || !total_amount || memberIds.length === 0) {
    return;
  }

  const { data: period, error } = await supabase
    .from("billing_periods")
    .insert({ service_id, label, start_date, end_date, total_amount })
    .select("id")
    .single();

  if (error || !period) return;

  const share = Math.round((total_amount / memberIds.length) * 100) / 100;
  const charges = memberIds.map((profile_id) => ({
    billing_period_id: period.id,
    profile_id,
    amount: share,
  }));

  await supabase.from("charges").insert(charges);

  revalidatePath("/admin/services");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}
