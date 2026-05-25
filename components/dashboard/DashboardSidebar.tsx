"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn, getInitials } from "@/lib/utils";
import {
  LayoutDashboard, CalendarPlus, Ticket, ScanLine,
  Users, BarChart3, Settings, LogOut, Zap, ChevronRight,
  Bell, Star, CreditCard,
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview", exact: true },
  { href: "/dashboard/events/new", icon: CalendarPlus, label: "Create Event" },
  { href: "/dashboard/attendees", icon: Users, label: "Attendees" },
  { href: "/dashboard/checkin", icon: ScanLine, label: "Check-in" },
];

const BOTTOM_NAV = [
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen flex flex-col border-r border-white/6 z-40 transition-all duration-300",
        "bg-navy-700",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-white/6 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 shadow-glow-accent/30">
          <Zap className="w-4 h-4 text-white fill-white" />
        </div>
        {!collapsed && (
          <span className="font-clash font-bold text-lg text-white">
            SHOW<span className="text-accent">PASS</span>
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto w-6 h-6 rounded-lg text-white/30 hover:text-white hover:bg-white/8 flex items-center justify-center transition-all"
        >
          <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* User profile */}
      <div className={cn("px-3 py-3 border-b border-white/6 flex-shrink-0", collapsed && "px-2")}>
        <div className={cn("flex items-center gap-2.5 p-2 rounded-xl bg-white/4", collapsed && "justify-center")}>
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-xs font-bold text-accent flex-shrink-0 border border-accent/20">
            {session?.user?.image ? (
              <Image src={session.user.image} alt="" width={32} height={32} className="rounded-lg" />
            ) : (
              getInitials(session?.user?.name ?? "U")
            )}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{session?.user?.name}</p>
              <p className="text-[10px] text-white/35 truncate">{session?.user?.email}</p>
            </div>
          )}
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {!collapsed && (
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest px-2 mb-2">
            Organiser
          </p>
        )}
        {NAV.map(({ href, icon: Icon, label, exact }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "sidebar-link",
              isActive(href, exact) && "active",
              collapsed && "justify-center px-2"
            )}
            title={collapsed ? label : undefined}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
            {!collapsed && isActive(href, exact) && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
            )}
          </Link>
        ))}

        {!collapsed && (
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest px-2 mt-4 mb-2">
            Quick links
          </p>
        )}
        <Link
          href="/events"
          className={cn("sidebar-link", collapsed && "justify-center px-2")}
          title={collapsed ? "Browse Events" : undefined}
        >
          <Ticket className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Browse Events</span>}
        </Link>
      </nav>

      {/* Bottom nav */}
      <div className="px-2 py-3 border-t border-white/6 space-y-0.5 flex-shrink-0">
        {BOTTOM_NAV.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn("sidebar-link", collapsed && "justify-center px-2")}
            title={collapsed ? label : undefined}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className={cn(
            "sidebar-link w-full text-red-400/70 hover:text-red-400 hover:bg-red-500/10",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Sign out" : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
