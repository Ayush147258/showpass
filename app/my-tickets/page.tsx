import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { generateQRDataUrl } from "@/lib/qr";
import { TicketStub } from "@/components/tickets/TicketStub";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Ticket, Calendar, Clock } from "lucide-react";
import Link from "next/link";

async function getMyTickets(userId: string) {
  const orders = await prisma.order.findMany({
    where: { buyerId: userId, status: "PAID" },
    include: {
      event: {
        include: { organiser: { select: { id: true, name: true, image: true } } },
      },
      tickets: {
        include: {
          tier: {
            include: {
              event: {
                include: { organiser: { select: { id: true, name: true, image: true } } },
              },
            },
          },
          order: { select: { id: true, status: true, totalAmount: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Generate QR data URLs per ticket
  const ticketsWithQR = await Promise.all(
    orders.flatMap((o) =>
      o.tickets.map(async (t) => ({
        ...t,
        qrDataUrl: await generateQRDataUrl(t.qrCode),
      }))
    )
  );

  const now = new Date();
  const upcoming = ticketsWithQR.filter((t) => new Date(t.tier.event.endAt) > now);
  const past = ticketsWithQR.filter((t) => new Date(t.tier.event.endAt) <= now);

  return { upcoming, past };
}

export default async function MyTicketsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth?callbackUrl=/my-tickets");

  const { upcoming, past } = await getMyTickets(session.user.id);
  const total = upcoming.length + past.length;

  return (
    <div className="min-h-screen bg-navy-700">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 pt-24 pb-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-clash text-3xl font-bold text-white mb-1">My Tickets</h1>
          <p className="text-white/40 text-sm">
            {total > 0 ? `${total} ticket${total !== 1 ? "s" : ""}` : "No tickets yet"}
          </p>
        </div>

        {total === 0 ? (
          <div className="text-center py-24">
            <Ticket className="w-16 h-16 text-white/8 mx-auto mb-4" />
            <h2 className="font-clash text-2xl font-bold text-white mb-2">No tickets yet</h2>
            <p className="text-white/40 mb-6">Your tickets will appear here after purchase.</p>
            <Link href="/events" className="btn-primary inline-flex items-center gap-2">
              <Ticket className="w-4 h-4" /> Find Events
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Upcoming */}
            {upcoming.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                  <h2 className="font-clash text-lg font-bold text-white">Upcoming</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-400 border border-teal-500/20 font-semibold">
                    {upcoming.length}
                  </span>
                </div>
                <div className="space-y-6">
                  {upcoming.map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket as any} qrDataUrl={ticket.qrDataUrl} />
                  ))}
                </div>
              </section>
            )}

            {/* Past */}
            {past.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-5">
                  <Clock className="w-4 h-4 text-white/30" />
                  <h2 className="font-clash text-lg font-bold text-white/50">Past Events</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/8 text-white/30 font-semibold">
                    {past.length}
                  </span>
                </div>
                <div className="space-y-6 opacity-60">
                  {past.map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket as any} qrDataUrl={ticket.qrDataUrl} isPast />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

function TicketCard({ ticket, qrDataUrl, isPast }: {
  ticket: any; qrDataUrl: string; isPast?: boolean;
}) {
  const event = ticket.tier.event;
  return (
    <div className={`rounded-2xl overflow-hidden ${isPast ? "grayscale-[30%]" : ""}`}>
      {/* Event info bar above ticket */}
      <div className="flex items-center justify-between px-1 pb-2">
        <Link href={`/events/${event.slug}`}
          className="text-sm font-semibold text-white/70 hover:text-accent transition-colors truncate mr-4">
          {event.title}
        </Link>
        <div className="flex items-center gap-1.5 text-xs text-white/30 whitespace-nowrap">
          <Calendar className="w-3 h-3" />
          {formatDate(event.startAt)}
        </div>
      </div>

      {/* The actual ticket stub */}
      <TicketStub ticket={ticket} qrDataUrl={qrDataUrl} />

      {/* Actions below ticket */}
      <div className="flex gap-2 mt-2 px-1">
        {ticket.isCheckedIn ? (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-teal-400">
            ✅ Checked in
          </span>
        ) : !isPast ? (
          <span className="flex items-center gap-1.5 text-xs text-white/30">
            🎟️ Ready to scan
          </span>
        ) : null}
        <span className="ml-auto text-xs text-white/20">
          {ticket.ticketRef}
        </span>
      </div>
    </div>
  );
}
