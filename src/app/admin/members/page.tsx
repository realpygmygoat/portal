import { createClient } from "@/lib/supabase/server";
import { addMember, removeMember } from "../actions";
import { MemberReminderSelect } from "./member-reminder-select";
import { ChevronMark } from "@/components/chevron-mark";
import type { Profile } from "@/lib/database.types";

export default async function MembersPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").order("full_name");
  const members = (data ?? []) as Profile[];

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <ChevronMark size={16} />
          <h1 className="text-xl font-semibold text-text">Members</h1>
        </div>
        <p className="mt-2 text-sm text-text-muted">
          Add a friend by email — they can sign in as soon as their row exists here, no
          separate invite needed.
        </p>
      </div>

      <form
        action={addMember}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-rule bg-surface p-5"
      >
        <div>
          <label className="block font-mono text-xs text-text-muted">Name</label>
          <input
            name="full_name"
            required
            className="mt-1 rounded-md border border-rule bg-ink px-2 py-1.5 text-sm text-text outline-none focus:border-brass"
          />
        </div>
        <div>
          <label className="block font-mono text-xs text-text-muted">Email</label>
          <input
            type="email"
            name="email"
            required
            className="mt-1 rounded-md border border-rule bg-ink px-2 py-1.5 text-sm text-text outline-none focus:border-brass"
          />
        </div>
        <div>
          <label className="block font-mono text-xs text-text-muted">Reminder</label>
          <select
            name="reminder_frequency"
            defaultValue="monthly"
            className="mt-1 rounded-md border border-rule bg-ink px-2 py-1.5 text-sm text-text outline-none focus:border-brass"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="biannual">Biannual</option>
            <option value="none">None</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md bg-brass px-3 py-1.5 text-sm font-medium text-ink hover:opacity-90"
        >
          Add member
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-rule bg-surface">
        <table className="w-full text-sm">
          <thead className="text-left text-text-muted">
            <tr className="border-b border-rule">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Signed in?</th>
              <th className="px-4 py-3 font-medium">Reminder</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {members.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3 font-medium text-text">
                  {m.full_name} {m.is_admin && <span className="text-xs text-text-muted">(admin)</span>}
                </td>
                <td className="px-4 py-3 text-text-muted">{m.email}</td>
                <td className="px-4 py-3 text-text-muted">{m.auth_user_id ? "Yes" : "Not yet"}</td>
                <td className="px-4 py-3">
                  <MemberReminderSelect profileId={m.id} current={m.reminder_frequency} />
                </td>
                <td className="px-4 py-3 text-right">
                  {!m.is_admin && (
                    <form action={removeMember}>
                      <input type="hidden" name="profile_id" value={m.id} />
                      <button type="submit" className="text-xs text-red-400 hover:underline">
                        Remove
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                  No members yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
