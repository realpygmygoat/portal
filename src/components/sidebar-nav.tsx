"use client";

import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
}

// Plain <a> tags, not next/link's <Link> — src/components/page-curtain.tsx
// intercepts every internal <a> click at the document level to run the
// sweep transition, and Link's own onClick would race it.
export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="mt-10 flex flex-col gap-0.5">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <a
            key={item.href}
            href={item.href}
            className={`rounded-md px-3 py-2 font-serif text-[1.05rem] transition-colors ${
              active ? "text-brass" : "text-text-muted hover:text-brass"
            }`}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
