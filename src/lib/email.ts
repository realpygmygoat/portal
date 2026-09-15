import { Resend } from "resend";

function money(n: number) {
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

export async function sendBalanceReminder(to: string, name: string, balance: number) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.REMINDER_FROM_EMAIL ?? "reminders@example.com";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  await resend.emails.send({
    from,
    to,
    subject: `Subscription balance: ${money(balance)} owed`,
    html: `
      <p>Hey ${name},</p>
      <p>Your current shared subscription balance is <strong>${money(balance)}</strong>.</p>
      <p><a href="${siteUrl}/dashboard">View your balance and history</a></p>
    `,
  });
}
