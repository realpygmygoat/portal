// Hand-written to match supabase/schema.sql. If you change the schema,
// update this file too (or generate it with `supabase gen types typescript`).

export type ReminderFrequency = "monthly" | "quarterly" | "biannual" | "none";

export interface Profile {
  id: string;
  auth_user_id: string | null;
  full_name: string;
  email: string;
  is_admin: boolean;
  reminder_frequency: ReminderFrequency;
  last_reminded_at: string | null;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  created_at: string;
}

export interface BillingPeriod {
  id: string;
  service_id: string;
  label: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  created_at: string;
}

export interface Charge {
  id: string;
  billing_period_id: string;
  profile_id: string;
  amount: number;
  created_at: string;
}

export interface Payment {
  id: string;
  profile_id: string;
  amount: number;
  paid_at: string;
  note: string | null;
  recorded_by: string | null;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  created_at: string;
}

export interface GroupMember {
  group_id: string;
  profile_id: string;
  created_at: string;
}

export interface MemberBalance {
  profile_id: string;
  full_name: string;
  email: string;
  reminder_frequency: ReminderFrequency;
  last_reminded_at: string | null;
  total_charged: number;
  total_paid: number;
  balance: number;
}

// Note: the Supabase clients in this app are intentionally untyped generics
// (no `Database` type param) — query results are cast to the interfaces
// above at each call site instead. Once you've created your Supabase
// project, run `supabase gen types typescript --project-id <id>` to
// generate a proper Database type and wire it back into the clients in
// src/lib/supabase/*.ts for full end-to-end type checking.
