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
      className="rounded-md border border-neutral-300 px-2 py-1 text-sm outline-none focus:border-neutral-500 disabled:opacity-50"
    >
      <option value="monthly">Monthly</option>
      <option value="quarterly">Quarterly</option>
      <option value="biannual">Biannual</option>
      <option value="none">None</option>
    </select>
  );
}
