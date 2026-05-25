"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "@/hooks/useCart";
import { cn, getInitials } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  Ticket, Search, ShoppingCart, ChevronDown, LayoutDashboard,
  User, LogOut, Star, Settings, Zap, Menu, X,
} from "lucide-react";
import Image from "next/image";

export function Navbar() {
  const { data: session } = useSession();
  const { itemCount } = useCart();
  const count = itemCount();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-navy-700/95 backdrop-blur-xl border-b border-white/8 shadow-nav"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-glow-accent group-hover:scale-110 transition-transform">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="font-clash font-bold text-xl text-white tracking-tight">
            SHOW<span className="text-accent">PASS</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          <NavLink href="/events">Discover</NavLink>
          <NavLink href="/events?category=MUSIC">Music</NavLink>
          <NavLink href="/events?category=TECH">Tech</NavLink>
          <NavLink href="/events?category=COLLEGE_FEST">Fests</NavLink>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/events"
            className="hidden md:flex w-9 h-9 items-center justify-center rounded-xl text-white/60 hover:text-white hover:bg-white/8 transition-all"
          >
            <Search className="w-4 h-4" />
          </Link>

          {/* Cart */}
          <Link href="/checkout" className="relative w-9 h-9 flex items-center justify-center rounded-xl text-white/60 hover:text-white hover:bg-white/8 transition-all">
            <ShoppingCart className="w-4 h-4" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center animate-scale-in">
                {count}
              </span>
            )}
          </Link>

          {/* Auth */}
          {session?.user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl hover:bg-white/8 transition-all"
              >
                <div className="w-7 h-7 rounded-lg overflow-hidden bg-accent/20 flex items-center justify-center border border-accent/30">
                  {session.user.image ? (
                    <Image src={session.user.image} alt="" width={28} height={28} className="rounded-lg" />
                  ) : (
                    <span className="text-xs font-bold text-accent">
                      {getInitials(session.user.name ?? "U")}
                    </span>
                  )}
                </div>
                <ChevronDown className="w-3 h-3 text-white/50" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-navy-700 border border-white/10 rounded-2xl shadow-xl overflow-hidden animate-scale-in">
                  <div className="px-4 py-3 border-b border-white/8">
                    <p className="text-sm font-semibold text-white truncate">{session.user.name}</p>
                    <p className="text-xs text-white/40 truncate">{session.user.email}</p>
                  </div>
                  <div className="p-1">
                    <UserMenuItem href="/my-tickets" icon={Ticket} label="My Tickets" />
                    {session.user.role === "ORGANISER" && (
                      <UserMenuItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                    )}
                    {session.user.role === "ADMIN" && (
                      <UserMenuItem href="/admin" icon={Settings} label="Admin Panel" />
                    )}
                    <UserMenuItem href="/profile" icon={User} label="Profile" />
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth"
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-600 transition-all shadow-glow-accent/30 hover:shadow-glow-accent"
            >
              <Ticket className="w-3.5 h-3.5" />
              Get Started
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl text-white/60 hover:text-white hover:bg-white/8 transition-all"
          >
            {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-navy-700/98 border-t border-white/8 px-4 py-4 space-y-1 animate-slide-up">
          <MobileNavLink href="/events" onClick={() => setMenuOpen(false)}>Discover Events</MobileNavLink>
          <MobileNavLink href="/events?category=MUSIC" onClick={() => setMenuOpen(false)}>Music</MobileNavLink>
          <MobileNavLink href="/events?category=TECH" onClick={() => setMenuOpen(false)}>Tech</MobileNavLink>
          <MobileNavLink href="/events?category=COLLEGE_FEST" onClick={() => setMenuOpen(false)}>College Fests</MobileNavLink>
          {!session?.user && (
            <Link href="/auth" className="block mt-3 text-center px-4 py-3 rounded-xl bg-accent text-white font-semibold">
              Get Started
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="px-3 py-2 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/8 transition-all">
      {children}
    </Link>
  );
}

function MobileNavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="block px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/8 transition-all font-medium">
      {children}
    </Link>
  );
}

function UserMenuItem({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/8 transition-all">
      <Icon className="w-4 h-4" /> {label}
    </Link>
  );
}
