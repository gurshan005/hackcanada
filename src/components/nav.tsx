"use client";

import { clsx } from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/dashboard", label: "Today" },
  { href: "/capture", label: "Capture" },
  { href: "/evidence", label: "Review" },
  { href: "/reports", label: "Reports" },
  { href: "/students", label: "Students" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="inline-flex flex-wrap gap-1 rounded-2xl border border-white/[0.2] bg-black/[0.28] p-1">
      {tabs.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              "rounded-xl border border-transparent px-4 py-1.5 text-sm font-medium",
              active
                ? "border-white/[0.52] bg-white/[0.16] text-white"
                : "text-white/[0.86] hover:bg-white/[0.12] hover:text-white",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
