import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CheckInPanel } from "@/components/dashboard/CheckInPanel";
import { formatDate, formatTime, EVENT_CATEGORY_LABELS } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";

export default async function CheckInPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/auth");

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      ticketTiers: {
        select: {
          id: true, name: true, type: true, capacity: true, sold: true,
          tickets: { where: { isCheckedIn: true }, select: { id: true } },
          _count: { select: { tickets: true } },
        },
      },
    },
  });

  if (!event) notFound();
  if (event.organiserId !== session.user.id && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const totalRegistered = event.ticketTiers.reduce((s, t) => s + t._count.tickets, 0);
  const totalCheckedIn = event.ticketTiers.reduce((s, t) => s + t.tickets.length, 0);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <Link href={`/dashboard/events/${event.id}`}
          className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-4 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to event
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-xs font-semibold text-teal-400 uppercase tracking-widest">
                Live Check-in
              </span>
            </div>
            <h1 className="font-clash text-2xl font-bold text-white">{event.title}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-1 text-xs text-white/40">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {formatDate(event.startAt)} · {formatTime(event.startAt)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {event.venue}, {event.city}
              </span>
              <span>{EVENT_CATEGORY_LABELS[event.category]}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tier mini stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {event.ticketTiers.map((tier) => {
          const pct = tier._count.tickets > 0
            ? Math.round((tier.tickets.length / tier._count.tickets) * 100)
            : 0;
          return (
            <div key={tier.id} className="bg-white/3 border border-white/8 rounded-xl p-3">
              <p className="text-xs text-white/40 truncate mb-1">{tier.name}</p>
              <p className="font-clash font-bold text-lg text-white">
                {tier.tickets.length}<span className="text-white/30 text-sm font-normal">/{tier._count.tickets}</span>
              </p>
              <div className="h-1 bg-white/8 rounded-full mt-1.5 overflow-hidden">
                <div className="h-full bg-teal-400 rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main check-in panel */}
      <CheckInPanel
        eventId={event.id}
        eventTitle={event.title}
        totalRegistered={totalRegistered}
        initialCheckedIn={totalCheckedIn}
      />
    </div>
  );
}
