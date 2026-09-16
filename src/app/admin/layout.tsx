import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/get-profile";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile?.is_admin) {
    redirect("/dashboard");
  }

  return <div className="mx-auto max-w-5xl px-10 py-12">{children}</div>;
}
