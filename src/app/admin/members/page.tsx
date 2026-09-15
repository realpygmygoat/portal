import { createClient } from "@/lib/supabase/server";
import { addMember, removeMember } from "../actions";
import { MemberReminderSelect } from "./member-reminder-select";

export default async function MembersPage() {
  const supabase = await createClient();
  const { data: members } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Members</h1>
        <p className="text-sm text-neutral-500">
          Add a friend by email — they can sign in as soon as their row exists here, no
          separate invite needed.
        </p>
      </div>

      <form
        action={addMember}
        className="flex flex-wrap items-end gap-2 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
      >
        <div>
          <label className="block text-xs text-neutral-500">Name</label>
          <input
            name="full_name"
            required
            className="mt-1 rounded-md border border-neutral-300 px-2 py-1 text-sm outline-none focus:border-neutral-500"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500">Email</label>
          <input
            type="email"
            name="email"
            required
            className="mt-1 rounded-md border border-neutral-300 px-2 py-1 text-sm outline-none focus:border-neutral-500"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500">Reminder</label>
          <select
            name="reminder_frequency"
            defaultValue="monthly"
            className="mt-1 rounded-md border border-neutral-300 px-2 py-1 text-sm outline-none focus:border-neutral-500"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="biannual">Biannual</option>
            <option value="none">None</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Add member
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Signed in?</th>
              <th className="px-4 py-2 font-medium">Reminder</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {(members ?? []).map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-2 font-medium text-neutral-900">
                  {m.full_name} {m.is_admin && <span className="text-xs text-neutral-400">(admin)</span>}
                </td>
                <td className="px-4 py-2 text-neutral-600">{m.email}</td>
                <td className="px-4 py-2 text-neutral-600">{m.auth_user_id ? "Yes" : "Not yet"}</td>
                <td className="px-4 py-2">
                  <MemberReminderSelect profileId={m.id} current={m.reminder_frequency} />
                </td>
                <td className="px-4 py-2 text-right">
                  {!m.is_admin && (
                    <form action={removeMember}>
                      <input type="hidden" name="profile_id" value={m.id} />
                      <button type="submit" className="text-xs text-red-600 hover:underline">
                        Remove
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
