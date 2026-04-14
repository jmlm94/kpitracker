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
  Network,
} from "lucide-react";
import { Wordmark } from "./Logo";
import { cx } from "@/lib/format";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, code: "01" },
  { href: "/departments", label: "Departments", icon: Building2, code: "02" },
  { href: "/team", label: "Team", icon: Users, code: "03" },
  { href: "/kpis", label: "KPIs & Targets", icon: Target, code: "04" },
  { href: "/integrations", label: "Integrations", icon: Plug, code: "05" },
  { href: "/org-chart", label: "Org Chart", icon: Network, code: "06" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-[248px] shrink-0 border-r border-white/10 bg-jet-950 px-4 pb-6 pt-5 lg:flex lg:flex-col">
      <div className="px-1">
        <Wordmark />
      </div>

      <div className="mt-8 mb-2 px-2 font-heading text-[10px] font-semibold uppercase tracking-brand text-white/35">
        [ Navigation ]
      </div>
      <nav className="flex flex-col gap-0.5">
        {nav.map(({ href, label, icon: Icon, code }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cx(
                "group relative flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm transition",
                active
                  ? "border-carbinox bg-carbinox/5 text-white"
                  : "border-transparent text-white/60 hover:border-white/20 hover:bg-white/[0.02] hover:text-white",
              )}
            >
              <span
                className={cx(
                  "font-numeric text-[10px] font-semibold tracking-wider",
                  active ? "text-carbinox" : "text-white/30",
                )}
              >
                {code}
              </span>
              <Icon
                size={15}
                className={cx(
                  "transition",
                  active ? "text-carbinox" : "text-white/45 group-hover:text-white",
                )}
              />
              <span className="font-heading font-semibold uppercase tracking-brand text-[12px]">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      <Link
        href="/onboarding"
        className="crosshair mt-8 flex items-start gap-3 border border-carbinox/50 bg-carbinox/[0.07] px-3 py-3 text-left transition hover:bg-carbinox/[0.12]"
      >
        <Sparkles size={16} className="mt-0.5 shrink-0 text-carbinox" />
        <div>
          <div className="font-heading text-[12px] font-semibold uppercase tracking-brand text-white">
            Onboarding
          </div>
          <div className="mt-0.5 text-[11px] text-white/60">
            Configure departments, KPIs, integrations.
          </div>
        </div>
      </Link>

      <div className="mt-auto pt-8 font-heading text-[10px] uppercase tracking-brand text-white/30">
        [ Carbinox Co. ] <span className="text-white/50">Build your outdoor artillery</span>
      </div>
    </aside>
  );
}
