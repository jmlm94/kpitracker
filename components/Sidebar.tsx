"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  Target,
  ClipboardCheck,
  PenLine,
  Settings as SettingsIcon,
  Menu,
  X,
} from "lucide-react";
import { Wordmark } from "./Logo";
import { cx } from "@/lib/format";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, code: "01" },
  { href: "/departments", label: "Departments", icon: Building2, code: "02" },
  { href: "/team", label: "Team", icon: Users, code: "03" },
  { href: "/kpis", label: "KPIs & Targets", icon: Target, code: "04" },
  { href: "/reports", label: "Reports", icon: ClipboardCheck, code: "05" },
  { href: "/settings", label: "Settings", icon: SettingsIcon, code: "06" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const content = (
    <>
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
              onClick={() => setOpen(false)}
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

      {/* Highlighted "Fill KPIs Here" */}
      <Link
        href="/fill"
        onClick={() => setOpen(false)}
        className={cx(
          "mt-6 flex items-center gap-3 border bg-carbinox text-jet-950 px-3 py-2.5 text-sm font-heading font-semibold uppercase tracking-brand transition hover:bg-carbinox-light",
          pathname === "/fill" ? "ring-2 ring-carbinox/40" : "",
        )}
      >
        <PenLine size={15} />
        <span>Fill KPIs Here</span>
        <span className="ml-auto text-[10px] font-numeric">→</span>
      </Link>

      <div className="mt-auto pt-8 font-heading text-[10px] uppercase tracking-brand text-white/30">
        [ Carbinox Co. ] <span className="text-white/50">Built tough. Run tight.</span>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(true)}
        className="fixed left-3 top-3 z-50 border border-white/10 bg-jet-950 p-2 text-white lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile slide-out */}
      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-white/10 bg-jet-950 px-4 pb-6 pt-5 transition-transform duration-200 lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 text-white/60 hover:text-white"
        >
          <X size={18} />
        </button>
        {content}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden w-[248px] shrink-0 border-r border-white/10 bg-jet-950 px-4 pb-6 pt-5 lg:flex lg:flex-col">
        {content}
      </aside>
    </>
  );
}
