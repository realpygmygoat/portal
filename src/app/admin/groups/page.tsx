import { createClient } from "@/lib/supabase/server";
import { createGroup, deleteGroup, addGroupMember, removeGroupMember } from "../actions";
import { ChevronMark } from "@/components/chevron-mark";
import type { Group, Profile } from "@/lib/database.types";

interface GroupMemberRow {
  group_id: string;
  profile_id: string;
  profiles: { full_name: string } | null;
}

export default async function GroupsPage() {
  const supabase = await createClient();

  const [{ data: groupsData }, { data: memberRowsData }, { data: profilesData }] = await Promise.all([
    supabase.from("groups").select("*").order("name"),
    supabase.from("group_members").select("group_id, profile_id, profiles(full_name)"),
    supabase.from("profiles").select("*").order("full_name"),
  ]);

  const groups = (groupsData ?? []) as Group[];
  const memberRows = (memberRowsData ?? []) as unknown as GroupMemberRow[];
  const profiles = (profilesData ?? []) as Profile[];

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <ChevronMark size={16} />
          <h1 className="text-xl font-semibold text-text">Groups</h1>
        </div>
        <p className="mt-2 text-sm text-text-muted">
          Save a recurring set of members (e.g. &ldquo;Spotify Crew&rdquo;) so you can prefill the split
          instantly next time you log a billing period, instead of re-checking everyone.
        </p>
      </div>

      <form
        action={createGroup}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-rule bg-surface p-5"
      >
        <div>
          <label className="block font-mono text-xs text-text-muted">Group name</label>
          <input
            name="name"
            required
            placeholder="e.g. Spotify Crew"
            className="mt-1 rounded-md border border-rule bg-ink px-2 py-1.5 text-sm text-text outline-none focus:border-brass"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-brass px-3 py-1.5 text-sm font-medium text-ink hover:opacity-90"
        >
          Create group
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2">
        {groups.map((group) => {
          const members = memberRows.filter((m) => m.group_id === group.id);
          const memberIds = new Set(members.map((m) => m.profile_id));
          const available = profiles.filter((p) => !memberIds.has(p.id));

          return (
            <div key={group.id} className="rounded-xl border border-rule bg-surface p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-lg font-semibold text-text">{group.name}</h2>
                <form action={deleteGroup}>
                  <input type="hidden" name="group_id" value={group.id} />
                  <button type="submit" className="text-xs text-red-400 hover:underline">
                    Delete
                  </button>
                </form>
              </div>

              <ul className="mt-3 space-y-1.5">
                {members.length === 0 && <li className="text-sm text-text-muted">No members yet.</li>}
                {members.map((m) => (
                  <li key={m.profile_id} className="flex items-center justify-between text-sm">
                    <span className="text-text">{m.profiles?.full_name ?? "—"}</span>
                    <form action={removeGroupMember}>
                      <input type="hidden" name="group_id" value={group.id} />
                      <input type="hidden" name="profile_id" value={m.profile_id} />
                      <button type="submit" className="text-xs text-text-muted hover:text-red-400">
                        Remove
                      </button>
                    </form>
                  </li>
                ))}
              </ul>

              {available.length > 0 && (
                <form action={addGroupMember} className="mt-4 flex items-center gap-2 border-t border-rule pt-4">
                  <input type="hidden" name="group_id" value={group.id} />
                  <select
                    name="profile_id"
                    required
                    className="flex-1 rounded-md border border-rule bg-ink px-2 py-1 text-sm text-text outline-none focus:border-brass"
                  >
                    {available.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-md bg-brass px-2 py-1 text-xs font-medium text-ink hover:opacity-90"
                  >
                    Add
                  </button>
                </form>
              )}
            </div>
          );
        })}
        {groups.length === 0 && (
          <p className="text-sm text-text-muted">No groups yet — create one above.</p>
        )}
      </div>
    </div>
  );
}
