"use client";

import { useActionState } from "react";
import { sendMagicLink } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(sendMagicLink, {});

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-neutral-900">Subscriptions Portal</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Sign in with the email the admin added you with.
        </p>

        {state.sent ? (
          <p className="mt-6 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
            Check your email for a sign-in link.
          </p>
        ) : (
          <form action={formAction} className="mt-6 space-y-3">
            <input
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
            {state.error && <p className="text-sm text-red-600">{state.error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
            >
              {pending ? "Sending..." : "Send magic link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
