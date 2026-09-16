import { getCurrentProfile } from "@/lib/get-profile";
import { signOut } from "@/app/logout/actions";
import { ChevronMark } from "./chevron-mark";
import { SidebarNav } from "./sidebar-nav";

const ADMIN_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/groups", label: "Groups" },
];

const MEMBER_ITEMS = [{ href: "/dashboard", label: "Dashboard" }];

export async function Sidebar() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const items = profile.is_admin ? ADMIN_ITEMS : MEMBER_ITEMS;

  return (
    <aside
      className="flex shrink-0 flex-col justify-between border-r border-rule px-6 py-10"
      style={{ width: "var(--sidebar-w)" }}
    >
      <div>
        <a href={profile.is_admin ? "/admin" : "/dashboard"} className="flex items-center gap-2">
          <span className="font-serif text-lg font-semibold text-text">
            Portal<span className="text-brass">.</span>
          </span>
          <ChevronMark size={15} />
        </a>
        <SidebarNav items={items} />
      </div>

      <div className="text-sm text-text-muted">
        <p className="truncate">{profile.full_name}</p>
        <form action={signOut}>
          <button type="submit" className="mt-2 font-mono text-xs hover:text-brass">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
