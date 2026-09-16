"use client";

import { useState } from "react";

interface GroupOption {
  id: string;
  name: string;
  memberIds: string[];
}

interface MemberOption {
  id: string;
  full_name: string;
}

// Owns the "Split between" checkbox list for the billing-period form.
// Picking a saved group from the dropdown checks its members instantly —
// still plain name="member_ids" checkboxes underneath, so the surrounding
// <form action={addBillingPeriod}> reads them the same way either way.
export function GroupMemberPicker({ groups, members }: { groups: GroupOption[]; members: MemberOption[] }) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <label className="font-mono text-xs text-text-muted">Split between</label>
        {groups.length > 0 && (
          <select
            defaultValue=""
            onChange={(e) => {
              const group = groups.find((g) => g.id === e.target.value);
              if (group) setChecked(new Set(group.memberIds));
            }}
            className="rounded-md border border-rule bg-ink px-2 py-0.5 font-mono text-xs text-text-muted outline-none focus:border-brass"
          >
            <option value="">Prefill from group…</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-3">
        {members.map((m) => (
          <label key={m.id} className="flex items-center gap-1.5 text-sm text-text">
            <input
              type="checkbox"
              name="member_ids"
              value={m.id}
              checked={checked.has(m.id)}
              onChange={() => toggle(m.id)}
            />
            {m.full_name}
          </label>
        ))}
      </div>
    </div>
  );
}
