import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/database.types";

// Returns null if signed in but not yet added as a member (no profile row),
// not just when signed out — callers should show a "contact the admin"
// message rather than treating this the same as a redirect-to-login.
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return data as Profile | null;
}
