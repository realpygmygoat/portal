"use client";

import { useActionState } from "react";
import { sendMagicLink } from "./actions";
import { ChevronMark } from "@/components/chevron-mark";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(sendMagicLink, {});

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-rule bg-surface p-8">
        <span className="flex items-center gap-2 font-serif text-lg font-semibold text-text">
          Portal<span className="text-brass">.</span>
          <ChevronMark size={15} />
        </span>
        <p className="mt-4 text-sm text-text-muted">
          Sign in with the email the admin added you with.
        </p>

        {state.sent ? (
          <p className="mt-6 rounded-md border border-sage/40 bg-sage/10 px-3 py-2 text-sm text-sage">
            Check your email for a sign-in link.
          </p>
        ) : (
          <form action={formAction} className="mt-6 space-y-3">
            <input
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-md border border-rule bg-ink px-3 py-2 text-sm text-text outline-none focus:border-brass"
            />
            {state.error && <p className="text-sm text-red-400">{state.error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-md bg-brass px-3 py-2 text-sm font-medium text-ink hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Sending..." : "Send magic link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
