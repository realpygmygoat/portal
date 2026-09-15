"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ReminderFrequency } from "@/lib/database.types";

export async function updateReminderFrequency(frequency: ReminderFrequency) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("profiles")
    .update({ reminder_frequency: frequency })
    .eq("auth_user_id", user.id);

  revalidatePath("/dashboard");
}
