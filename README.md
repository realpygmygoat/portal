# Subscriptions Portal

Tracks shared subscription costs (Spotify, Amazon Prime, YouTube Premium, etc.) split
across a group of friends: each member signs in to see their own balance and history,
gets email reminders on their own schedule, and the admin gets a dashboard of who owes what.

Stack: Next.js (App Router) + Supabase (Postgres, auth) + Resend (email), deployed on Vercel.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In **Project Settings > API Keys**, copy the Project URL, the **publishable** key, and
   create a **secret** key (Supabase's newer key format — see the walkthrough below for
   detail if you're not familiar with these).
3. In **Database > SQL Editor**, paste and run the contents of [`supabase/schema.sql`](supabase/schema.sql).
4. In **Authentication > Providers**, make sure **Email** is enabled. Under
   **Authentication > Sign In / Providers > Email**, turn off "Confirm email" if you'd
   rather magic links work instantly (optional).
5. Bootstrap yourself as the first admin — edit the commented `insert` at the bottom of
   `schema.sql` with your own name/email and run just that statement in the SQL Editor.

## 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SECRET_KEY` — from step 1.
- `NEXT_PUBLIC_SITE_URL` — `http://localhost:3000` locally, your real domain once deployed.
- `RESEND_API_KEY` / `REMINDER_FROM_EMAIL` — create a free account at [resend.com](https://resend.com),
  verify a sending domain (or use their test domain while developing), and generate an API key.
- `CRON_SECRET` — any random string (e.g. `openssl rand -hex 32`); protects the reminder endpoint.

In Supabase's **Authentication > URL Configuration**, add `http://localhost:3000/auth/callback`
(and later your production `https://yourdomain.com/auth/callback`) to the redirect allow list.

## 3. Run it locally

```bash
npm install
npm run dev
```

Sign in at `/login` with the email you bootstrapped as admin. You'll land on `/dashboard`;
the **Admin** link appears in the nav for admins.

## 4. How it works

- **Members** are rows in `profiles`, added from `/admin/members` by email — no separate
  invite step. The first time someone signs in with a magic link, a database trigger links
  their new Supabase auth user to the pre-existing profile row by matching email.
- **Services & billing periods** (`/admin/services`): add a service once (e.g. "Spotify
  Family"), then log each billing period — a price change, or people joining/leaving — with
  a total cost and who to split it across. The cost splits evenly among the selected members.
- **Balances**: each member's balance = sum of their charges − sum of their recorded
  payments. Admins record payments from the overview page as friends pay them back.
- **Reminders**: each member picks their own cadence (monthly/quarterly/biannual/none) from
  their dashboard. A daily cron job (`/api/cron/reminders`) emails anyone who's due and has
  a positive balance, via Resend.

## 5. Deploy

1. Push this repo to GitHub and import it into [Vercel](https://vercel.com/new).
2. Add the same environment variables from `.env.local` in the Vercel project settings,
   with `NEXT_PUBLIC_SITE_URL` set to your production URL.
3. `vercel.json` already defines a daily cron hitting `/api/cron/reminders` — Vercel picks
   this up automatically on deploy (Cron Jobs are available on Vercel's free Hobby plan,
   limited to once/day, which matches this schedule).
4. Add the production callback URL to Supabase's redirect allow list (step 2 above).

To test the reminder job manually before relying on the cron schedule:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://yourdomain.com/api/cron/reminders
```
