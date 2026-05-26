import { Suspense } from "react";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { CategoryPills } from "@/components/landing/CategoryPills";
import { FeaturedEvents } from "@/components/landing/FeaturedEvents";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { TicketShowcase } from "@/components/landing/TicketShowcase";
import { OrganizerCTA } from "@/components/landing/OrganizerCTA";
import { SocialProof } from "@/components/landing/SocialProof";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getHomeEvents() {
  try {
    return await prisma.event.findMany({
      where: { isPublished: true },
      include: {
        organiser: { select: { id: true, name: true, image: true } },
        ticketTiers: true,
        _count: { select: { reviews: true } },
      },
      orderBy: [{ isFeatured: "desc" }, { startAt: "asc" }],
      take: 8,
    });
  } catch (error) {
    console.error("Failed to load homepage events", error);
    return [];
  }
}

export default async function HomePage() {
  const events = await getHomeEvents();

  return (
    <div className="min-h-screen bg-navy-700 overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <CategoryPills />
      <Suspense fallback={<div className="h-96" />}>
        <FeaturedEvents events={events} />
      </Suspense>
      <HowItWorks />
      <TicketShowcase />
      <OrganizerCTA />
      <SocialProof />
      <Footer />
    </div>
  );
}
