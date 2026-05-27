import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EVENT_CATEGORY_LABELS, formatDate, formatTime } from "@/lib/utils";
import { Calendar, MapPin, ScanLine, Ticket } from "lucide-react";

async function getCheckInEvents(organiserId: string, isAdmin: boolean) {
  return prisma.event.findMany({
    where: isAdmin ? {} : { organiserId },
    select: {
      id: true,
      title: true,
      category: true,
      startAt: true,
      venue: true,
      city: true,
      isPublished: true,
      ticketTiers: {
        select: {
          sold: true,
          _count: { select: { tickets: true } },
          tickets: { where: { isCheckedIn: true }, select: { id: true } },
        },
      },
    },
    orderBy: [{ startAt: "desc" }],
    take: 50,
  });
}

export default async function CheckInIndexPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth");

  const events = await getCheckInEvents(session.user.id, session.user.role === "ADMIN");

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ScanLine className="w-5 h-5 text-accent" />
          <span className="text-xs font-semibold text-accent uppercase tracking-widest">
            Check-in
          </span>
        </div>
        <h1 className="font-clash text-3xl font-bold text-white">Choose an event</h1>
        <p className="text-white/40 text-sm mt-1">
          Open the live scanner for one of your posted events.
        </p>
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-white/3 p-10 text-center">
          <Ticket className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <p className="text-white/35 text-sm mb-4">No events available for check-in yet.</p>
          <Link href="/dashboard/events/new" className="text-sm font-semibold text-accent hover:underline">
            Create an event
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {events.map((event) => {
            const totalRegistered = event.ticketTiers.reduce((sum, tier) => sum + tier._count.tickets, 0);
            const totalCheckedIn = event.ticketTiers.reduce((sum, tier) => sum + tier.tickets.length, 0);
            const pct = totalRegistered > 0 ? Math.round((totalCheckedIn / totalRegistered) * 100) : 0;

            return (
              <div key={event.id} className="rounded-2xl border border-white/8 bg-white/3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-clash text-lg font-bold text-white truncate">
                        {event.title}
                      </h2>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        event.isPublished
                          ? "bg-teal-500/15 text-teal-400 border-teal-500/25"
                          : "bg-gold-500/15 text-gold-500 border-gold-500/25"
                      }`}>
                        {event.isPublished ? "Live" : "Draft"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/40">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDate(event.startAt)} - {formatTime(event.startAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {event.venue}, {event.city}
                      </span>
                      <span>{EVENT_CATEGORY_LABELS[event.category]}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-white/35">Checked in</span>
                    <span className="font-semibold text-white">
                      {totalCheckedIn}/{totalRegistered} ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-teal-400"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-2">
                  <Link
                    href={`/dashboard/events/${event.id}`}
                    className="px-3 py-2 rounded-xl bg-white/6 border border-white/10 text-white/60 hover:text-white text-xs font-semibold transition-all"
                  >
                    Manage
                  </Link>
                  <Link
                    href={`/dashboard/checkin/${event.id}`}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent-600 transition-all"
                  >
                    <ScanLine className="w-3.5 h-3.5" /> Open Check-in
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
