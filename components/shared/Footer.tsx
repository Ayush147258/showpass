import Link from "next/link";
import { Zap, Twitter, Instagram, Linkedin, Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-navy-700 border-t border-white/6 text-white/60">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <Zap className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="font-clash font-bold text-xl text-white">
                SHOW<span className="text-accent">PASS</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-6 max-w-xs">
              India&apos;s smartest event ticketing platform. From college fests to sold-out concerts.
            </p>
            <div className="flex gap-3">
              {[Twitter, Instagram, Linkedin, Github].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-xl bg-white/6 hover:bg-white/12 flex items-center justify-center transition-all hover:scale-110">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Discover */}
          <div>
            <p className="text-xs font-semibold text-white uppercase tracking-widest mb-4">Discover</p>
            {["All Events", "Music", "Tech", "College Fests", "Comedy", "Workshops"].map((l) => (
              <FooterLink key={l} href="/events">{l}</FooterLink>
            ))}
          </div>

          {/* Host */}
          <div>
            <p className="text-xs font-semibold text-white uppercase tracking-widest mb-4">Host</p>
            {["Create Event", "Pricing", "Organiser Dashboard", "QR Check-in", "Analytics"].map((l) => (
              <FooterLink key={l} href="/dashboard">{l}</FooterLink>
            ))}
          </div>

          {/* Company */}
          <div>
            <p className="text-xs font-semibold text-white uppercase tracking-widest mb-4">Company</p>
            {["About", "Blog", "Careers", "Privacy Policy", "Terms"].map((l) => (
              <FooterLink key={l} href="#">{l}</FooterLink>
            ))}
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© 2025 SHOWPASS by EventSphere Technologies. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <span className="text-accent">⚡</span> for DevFusion 2.0
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block text-sm py-1 hover:text-white transition-colors">
      {children}
    </Link>
  );
}
