import Link from "next/link";
import { getCurrentProfile } from "@/lib/get-profile";
import { signOut } from "@/app/logout/actions";

export async function NavBar() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <nav className="flex items-center gap-4 text-sm">
          <span className="font-semibold text-neutral-900">Subscriptions</span>
          <Link href="/dashboard" className="text-neutral-600 hover:text-neutral-900">
            My balance
          </Link>
          {profile.is_admin && (
            <Link href="/admin" className="text-neutral-600 hover:text-neutral-900">
              Admin
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3 text-sm text-neutral-500">
          <span>{profile.full_name}</span>
          <form action={signOut}>
            <button type="submit" className="text-neutral-500 hover:text-neutral-900">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
