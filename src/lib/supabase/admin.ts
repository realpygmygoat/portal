import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Secret-key client: bypasses RLS. Server-only — never import this from
// client components, and never expose SUPABASE_SECRET_KEY to the browser.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
