"use server";

import { createClient } from "@/lib/supabase/server";

export async function sendMagicLink(
  _prevState: { error?: string; sent?: boolean },
  formData: FormData,
): Promise<{ error?: string; sent?: boolean }> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    return { error: "Enter your email." };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    return { error: "Something went wrong sending the link. Try again." };
  }

  return { sent: true };
}
