import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AttendeeTable } from "@/components/dashboard/AttendeeTable";
import { AttendeeTableServer } from "@/components/dashboard/AttendeeTableServer";
import { Users, Ticket, CheckCircle2 } from "lucide-react";

async function getStats(organiserId: string) {
  const [total, checkedIn, events] = await Promise.all([
    prisma.ticket.count({ where: { tier: { event: { organiserId } }, order: { status: "PAID" } } }),
    prisma.ticket.count({ where: { tier: { event: { organiserId } }, order: { status: "PAID" }, isCheckedIn: true } }),
    prisma.event.findMany({
      where: { organiserId },
      select: { id: true, title: true },
      orderBy: { startAt: "desc" },
      take: 20,
    }),
  ]);
  return { total, checkedIn, events };
}

export default async function AttendeesPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth");

  const { total, checkedIn, events } = await getStats(session.user.id);
  const firstEventId = events[0]?.id;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-clash text-3xl font-bold text-white">Attendees</h1>
        <p className="text-white/40 text-sm mt-1">All registered attendees across your events</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 max-w-xl">
        <div className="bg-white/3 border border-white/8 rounded-xl p-4">
          <Users className="w-4 h-4 text-accent mb-2" />
          <p className="font-clash font-bold text-xl text-white">{total.toLocaleString("en-IN")}</p>
          <p className="text-xs text-white/35">Total registered</p>
        </div>
        <div className="bg-white/3 border border-white/8 rounded-xl p-4">
          <CheckCircle2 className="w-4 h-4 text-teal-400 mb-2" />
          <p className="font-clash font-bold text-xl text-teal-400">{checkedIn.toLocaleString("en-IN")}</p>
          <p className="text-xs text-white/35">Checked in</p>
        </div>
        <div className="bg-white/3 border border-white/8 rounded-xl p-4">
          <Ticket className="w-4 h-4 text-purple-400 mb-2" />
          <p className="font-clash font-bold text-xl text-white">{events.length}</p>
          <p className="text-xs text-white/35">Events</p>
        </div>
      </div>

      {/* Per-event selector + table */}
      {events.length === 0 ? (
        <div className="text-center py-16 text-white/25">No events yet. Create one to see attendees.</div>
      ) : firstEventId ? (
        <AttendeeTableWithSelector events={events} />
      ) : null}
    </div>
  );
}

// Client wrapper for event selector
function AttendeeTableWithSelector({ events }: { events: { id: string; title: string }[] }) {
  return <AttendeeTableServer events={events} />;
}
