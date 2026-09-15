"use client";

import { useTransition } from "react";
import type { ReminderFrequency } from "@/lib/database.types";
import { updateReminderFrequency } from "./actions";

const OPTIONS: { value: ReminderFrequency; label: string }[] = [
  { value: "monthly", label: "Every month" },
  { value: "quarterly", label: "Every 3 months" },
  { value: "biannual", label: "Every 6 months" },
  { value: "none", label: "Don't remind me" },
];

export function ReminderForm({ current }: { current: ReminderFrequency }) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={current}
      disabled={pending}
      onChange={(e) =>
        startTransition(() => {
          updateReminderFrequency(e.target.value as ReminderFrequency);
        })
      }
      className="rounded-md border border-neutral-300 px-2 py-1 text-sm outline-none focus:border-neutral-500 disabled:opacity-50"
    >
      {OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
