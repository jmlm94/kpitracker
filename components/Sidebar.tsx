"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  Target,
  Plug,
  Sparkles,
} from "lucide-react";
import { Logo } from "./Logo";
import { cx } from "@/lib/format";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/departments", label: "Departments", icon: Building2 },
  { href: "/team", label: "Team", icon: Users },
  { href: "/kpis", label: "KPIs & Targets", icon: Target },
  { href: "/integrations", label: "Integrations", icon: Plug },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-[240px] shrink-0 border-r border-white/5 bg-ink-900/70 px-4 pb-6 pt-5 lg:block">
      <div className="px-2">
        <Logo />
      </div>
      <nav className="mt-8 flex flex-col gap-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cx(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                active
                  ? "bg-white/[0.06] text-white"
                  : "text-white/60 hover:bg-white/[0.03] hover:text-white",
              )}
            >
              <Icon
                size={16}
                className={cx(
                  "transition",
                  active ? "text-accent" : "text-white/40 group-hover:text-white/70",
                )}
              />
              <span>{label}</span>
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />}
            </Link>
          );
        })}
      </nav>
      <div className="mt-8">
        <Link
          href="/onboarding"
          className="flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/10 px-3 py-3 text-left transition hover:bg-accent/20"
        >
          <Sparkles size={16} className="mt-0.5 shrink-0 text-accent" />
          <div>
            <div className="text-sm font-semibold text-white">Onboarding</div>
            <div className="text-[11px] text-white/60">
              Set up departments, KPIs & targets
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
}
