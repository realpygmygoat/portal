"use client";

import { useTransition } from "react";
import type { ReminderFrequency } from "@/lib/database.types";
import { updateMemberReminder } from "../actions";

export function MemberReminderSelect({
  profileId,
  current,
}: {
  profileId: string;
  current: ReminderFrequency;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={current}
      disabled={pending}
      onChange={(e) =>
        startTransition(() => {
          updateMemberReminder(profileId, e.target.value as ReminderFrequency);
        })
      }
      className="rounded-md border border-rule bg-ink px-2 py-1 text-sm text-text outline-none focus:border-brass disabled:opacity-50"
    >
      <option value="monthly">Monthly</option>
      <option value="quarterly">Quarterly</option>
      <option value="biannual">Biannual</option>
      <option value="none">None</option>
    </select>
  );
}
