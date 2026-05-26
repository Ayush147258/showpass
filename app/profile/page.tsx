import { redirect } from "next/navigation";
import { CalendarDays, Mail, Shield, Ticket, UserRound } from "lucide-react";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";

const roleLabels = {
  ATTENDEE: "Attendee",
  ORGANISER: "Organiser",
  ADMIN: "Admin",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/auth?callbackUrl=/profile");

  const initials = (session.user.name ?? session.user.email ?? "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-navy-700">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 pb-20 pt-28">
        <div className="mb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-teal-300">
            Account
          </p>
          <h1 className="font-clash text-4xl font-bold text-white">Profile</h1>
          <p className="mt-2 text-sm text-white/50">
            Your Showpass identity for tickets, events, and dashboard access.
          </p>
        </div>

        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.075] via-white/[0.045] to-teal-400/[0.035] p-6 shadow-ticket">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border border-accent/35 bg-accent/18 text-3xl font-black text-accent shadow-glow-accent/20">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-clash text-2xl font-bold text-white">
                {session.user.name ?? "Showpass User"}
              </h2>
              <p className="mt-1 truncate text-sm text-white/55">{session.user.email}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-teal-300/25 bg-teal-300/10 px-3 py-1 text-xs font-bold text-teal-200">
                  <Shield className="h-3.5 w-3.5" />
                  {roleLabels[session.user.role]}
                </span>
                {session.user.isVerified && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-gold-300/25 bg-gold-300/10 px-3 py-1 text-xs font-bold text-gold-200">
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <ProfileInfo icon={UserRound} label="Display Name" value={session.user.name ?? "Not set"} />
            <ProfileInfo icon={Mail} label="Email" value={session.user.email ?? "Not set"} />
            <ProfileInfo icon={Ticket} label="Account Type" value={roleLabels[session.user.role]} />
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-navy-600/70 p-4">
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-5 w-5 text-accent" />
              <div>
                <p className="text-sm font-bold text-white">Profile editing</p>
                <p className="mt-1 text-sm leading-6 text-white/50">
                  Name and email are managed through your login provider or demo account.
                  Ticket attendee names can still be customized during checkout.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function ProfileInfo({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-navy-600/70 p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/8 text-teal-300">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xs font-bold uppercase tracking-widest text-white/35">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
