import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/get-profile";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile?.is_admin) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <nav className="mb-6 flex gap-4 text-sm">
        <Link href="/admin" className="text-neutral-600 hover:text-neutral-900">
          Overview
        </Link>
        <Link href="/admin/members" className="text-neutral-600 hover:text-neutral-900">
          Members
        </Link>
        <Link href="/admin/services" className="text-neutral-600 hover:text-neutral-900">
          Services & billing
        </Link>
      </nav>
      {children}
    </div>
  );
}
