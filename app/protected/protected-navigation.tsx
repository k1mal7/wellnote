"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Archive, CalendarDays, LayoutDashboard, Menu, Users, X } from "lucide-react";

const items = [
  { href: "/protected", label: "Dashboard", icon: LayoutDashboard },
  { href: "/protected/clients", label: "Clients", icon: Users },
  { href: "/protected/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/protected/archived", label: "Archived clients", icon: Archive },
];

export default function ProtectedNavigation({ workspaceLabel }: { workspaceLabel: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const editingVisit = pathname.endsWith("/new-visit");
  return (
    <aside className="border-b border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-60 lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between px-6 py-5">
        <div className="min-w-0"><p className="text-xl font-bold tracking-tight text-emerald-800">WellNote</p><p className="mt-1 break-words text-xs text-slate-500">{workspaceLabel}</p></div>
        <button type="button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="workspace-navigation" onClick={() => setOpen(!open)} className="rounded-lg p-2 hover:bg-slate-100 lg:hidden">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      <nav id="workspace-navigation" aria-label="Main navigation" className={`${open ? "block" : "hidden"} space-y-1 px-3 pb-5 lg:block`}>
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/protected" ? pathname === href : pathname.startsWith(href);
          return <Link key={href} href={href} aria-current={active ? "page" : undefined}
            onNavigate={(event) => {
              if (editingVisit && !window.confirm("Leave this visit? Wait for ‘Draft saved’ and save any assessment results first. Unsaved assessment entries will be lost.")) {
                event.preventDefault();
                return;
              }
              setOpen(false);
            }}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${active ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
            <Icon size={19} aria-hidden="true" />{label}
          </Link>;
        })}
      </nav>
    </aside>
  );
}
