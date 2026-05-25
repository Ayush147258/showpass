import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

function slug(title: string) {
  return title.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "") + "-" + nanoid(6);
}

async function main() {
  console.log("🌱 Seeding SHOWPASS database...");

  // ── Users ──────────────────────────────────────────────────────────
  const [organiser1, organiser2, organiser3, attendee1, attendee2, attendee3, admin] = await Promise.all([
    prisma.user.upsert({
      where: { email: "organiser@showpass.demo" },
      update: {},
      create: { email: "organiser@showpass.demo", name: "Arjun Mehta", role: "ORGANISER", isVerified: true },
    }),
    prisma.user.upsert({
      where: { email: "rahul@showpass.demo" },
      update: {},
      create: { email: "rahul@showpass.demo", name: "Rahul Sharma", role: "ORGANISER", isVerified: true },
    }),
    prisma.user.upsert({
      where: { email: "priya.events@showpass.demo" },
      update: {},
      create: { email: "priya.events@showpass.demo", name: "Priya Kapoor Events", role: "ORGANISER", isVerified: true },
    }),
    prisma.user.upsert({
      where: { email: "attendee@showpass.demo" },
      update: {},
      create: { email: "attendee@showpass.demo", name: "Priya Sharma", role: "ATTENDEE", isVerified: true },
    }),
    prisma.user.upsert({
      where: { email: "akash@showpass.demo" },
      update: {},
      create: { email: "akash@showpass.demo", name: "Akash Verma", role: "ATTENDEE", isVerified: true },
    }),
    prisma.user.upsert({
      where: { email: "sneha@showpass.demo" },
      update: {},
      create: { email: "sneha@showpass.demo", name: "Sneha Patel", role: "ATTENDEE", isVerified: true },
    }),
    prisma.user.upsert({
      where: { email: "admin@showpass.demo" },
      update: {},
      create: { email: "admin@showpass.demo", name: "Admin User", role: "ADMIN", isVerified: true },
    }),
  ]);

  // ── Organiser profiles ─────────────────────────────────────────────
  await Promise.all([
    prisma.organiserProfile.upsert({
      where: { userId: organiser1.id },
      update: {},
      create: { userId: organiser1.id, orgName: "Arjun Mehta Productions", bio: "Award-winning event producer. NH7 Weekender, Sunburn, Magnetic Fields.", website: "https://arjunmehta.in", isPro: true, totalEarned: 842000 },
    }),
    prisma.organiserProfile.upsert({
      where: { userId: organiser2.id },
      update: {},
      create: { userId: organiser2.id, orgName: "React India", bio: "India's largest React.js conference. Tech for everyone.", website: "https://reactindia.io", isPro: true, totalEarned: 320000 },
    }),
    prisma.organiserProfile.upsert({
      where: { userId: organiser3.id },
      update: {},
      create: { userId: organiser3.id, orgName: "Priya Kapoor Events", bio: "College fest specialist. 50+ events across IITs and NITs.", website: "https://prijaevents.in", isPro: false, totalEarned: 120000 },
    }),
  ]);

  // ── Events ─────────────────────────────────────────────────────────
  const FUTURE = (daysFromNow: number) => new Date(Date.now() + daysFromNow * 86400000);
  const PAST = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000);

  const eventsData = [
    {
      organiserId: organiser1.id, title: "NH7 Weekender 2025", category: "MUSIC" as const,
      description: "Three days of the finest independent music. NH7 Weekender returns to Pune with headliners from across the globe. Expect surprise acts, intimate venue vibes, and music that moves you. This isn't just a festival — it's a feeling you'll chase for years.",
      venue: "NSCI Dome", city: "Pune", address: "Worli, Mumbai – Pune Expressway", lat: 18.5204, lng: 73.8567,
      startAt: FUTURE(45), endAt: FUTURE(47), isPublished: true, isFeatured: true,
      bannerUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1400&q=80",
      tiers: [
        { name: "Day Pass", type: "GENERAL" as const, price: 1499, capacity: 800, sold: 612, sortOrder: 0 },
        { name: "3-Day Pass", type: "GENERAL" as const, price: 3499, capacity: 400, sold: 287, sortOrder: 1 },
        { name: "VIP Weekend", type: "VIP" as const, price: 7999, capacity: 100, sold: 89, sortOrder: 2 },
        { name: "Early Bird", type: "EARLY_BIRD" as const, price: 999, capacity: 200, sold: 200, sortOrder: 3, earlyBirdPrice: 799 },
      ],
    },
    {
      organiserId: organiser2.id, title: "React India Conference 2025", category: "TECH" as const,
      description: "India's largest React ecosystem conference is back. Two days of deep technical talks, workshops, and networking with 1,000+ frontend engineers. Speakers from Meta, Vercel, and top Indian startups. Level up your frontend game.",
      venue: "Bangalore International Exhibition Centre", city: "Bangalore", address: "Tumkur Road, Madavara, Bangalore",
      lat: 13.0827, lng: 77.5877, startAt: FUTURE(62), endAt: FUTURE(63), isPublished: true, isFeatured: true,
      bannerUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1400&q=80",
      tiers: [
        { name: "Community", type: "GENERAL" as const, price: 999, capacity: 500, sold: 342, sortOrder: 0 },
        { name: "Professional", type: "PREMIUM" as const, price: 2499, capacity: 200, sold: 156, sortOrder: 1 },
        { name: "Workshop Day", type: "GENERAL" as const, price: 1499, capacity: 100, sold: 87, sortOrder: 2 },
      ],
    },
    {
      organiserId: organiser3.id, title: "IIT-BHU Spardha 2025", category: "COLLEGE_FEST" as const,
      description: "IIT BHU's annual cultural extravaganza is here. Three days of competitions, performances, and chaos — the way we like it. From Battle of Bands to comedy nights, Spardha 2025 has something for every soul. Register now before seats run out.",
      venue: "Rajput Club Ground, IIT-BHU", city: "Varanasi", address: "IIT BHU Campus, Varanasi, UP",
      lat: 25.2677, lng: 82.9913, startAt: FUTURE(20), endAt: FUTURE(22), isPublished: true, isFeatured: false,
      bannerUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1400&q=80",
      tiers: [
        { name: "Student Pass", type: "EARLY_BIRD" as const, price: 199, capacity: 1000, sold: 734, sortOrder: 0, earlyBirdPrice: 99 },
        { name: "General", type: "GENERAL" as const, price: 299, capacity: 500, sold: 312, sortOrder: 1 },
        { name: "VIP Lounge", type: "VIP" as const, price: 999, capacity: 50, sold: 38, sortOrder: 2 },
      ],
    },
    {
      organiserId: organiser1.id, title: "Mumbai Comedy Festival", category: "COMEDY" as const,
      description: "Five nights. Twenty comedians. Zero bad jokes. Mumbai Comedy Festival brings together India's sharpest stand-up talent for an unforgettable week of laughter. From clean comedy to dark wit — we've got a night for every sensibility.",
      venue: "NCPA Amphitheatre", city: "Mumbai", address: "Nariman Point, Mumbai 400021",
      lat: 18.9254, lng: 72.8244, startAt: FUTURE(15), endAt: FUTURE(19), isPublished: true, isFeatured: false,
      bannerUrl: "https://images.unsplash.com/photo-1527224538127-2104bb71c51b?w=1400&q=80",
      tiers: [
        { name: "Single Night", type: "GENERAL" as const, price: 699, capacity: 300, sold: 198, sortOrder: 0 },
        { name: "Festival Pass", type: "PREMIUM" as const, price: 2499, capacity: 100, sold: 67, sortOrder: 1 },
      ],
    },
    {
      organiserId: organiser2.id, title: "Fitness Mania Delhi 2025", category: "FITNESS" as const,
      description: "India's biggest fitness expo is landing in Delhi. Two days of masterclasses, nutrition workshops, HIIT sessions with celebrity trainers, and an expo featuring 100+ fitness brands. Whether you're a beginner or a beast — this is your arena.",
      venue: "Pragati Maidan", city: "Delhi", address: "Mathura Road, New Delhi 110001",
      lat: 28.6139, lng: 77.2090, startAt: FUTURE(30), endAt: FUTURE(31), isPublished: true, isFeatured: false,
      bannerUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1400&q=80",
      tiers: [
        { name: "Day Pass", type: "GENERAL" as const, price: 599, capacity: 600, sold: 421, sortOrder: 0 },
        { name: "Weekend Pass", type: "GENERAL" as const, price: 999, capacity: 300, sold: 187, sortOrder: 1 },
        { name: "VIP + Masterclass", type: "VIP" as const, price: 2499, capacity: 50, sold: 43, sortOrder: 2 },
      ],
    },
    {
      organiserId: organiser3.id, title: "UI/UX Design Workshop — Figma Pro", category: "WORKSHOP" as const,
      description: "Master Figma in one intensive day. This hands-on workshop covers Auto Layout 4.0, Variables, Prototyping, and Design Systems. You'll leave with a portfolio-ready project and the confidence to design production-grade interfaces.",
      venue: "The Hive Co-working", city: "Bangalore", address: "Koramangala 5th Block, Bangalore 560095",
      lat: 12.9352, lng: 77.6245, startAt: FUTURE(10), endAt: FUTURE(10), isPublished: true, isFeatured: false,
      bannerUrl: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=1400&q=80",
      tiers: [
        { name: "Standard", type: "GENERAL" as const, price: 1499, capacity: 30, sold: 22, sortOrder: 0 },
        { name: "With Mentoring", type: "PREMIUM" as const, price: 2999, capacity: 10, sold: 8, sortOrder: 1 },
      ],
    },
    {
      organiserId: organiser1.id, title: "Sunburn Arena ft. DJ Snake", category: "MUSIC" as const,
      description: "DJ Snake headlines Sunburn Arena for one night only. Pure electronic madness. No support acts. No warm-ups. Just three hours of the world's biggest EDM artist going full throttle. Pune hasn't been hit this hard. Ever.",
      venue: "Mahalunge Ground", city: "Pune", address: "Mahalunge, Balewadi, Pune 411045",
      lat: 18.5741, lng: 73.7757, startAt: FUTURE(8), endAt: FUTURE(8), isPublished: true, isFeatured: true,
      bannerUrl: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=1400&q=80",
      tiers: [
        { name: "General", type: "GENERAL" as const, price: 1999, capacity: 2000, sold: 1734, sortOrder: 0 },
        { name: "VIP Pit", type: "VIP" as const, price: 4999, capacity: 200, sold: 178, sortOrder: 1 },
        { name: "Platinum", type: "PREMIUM" as const, price: 9999, capacity: 50, sold: 47, sortOrder: 2 },
      ],
    },
    {
      organiserId: organiser2.id, title: "Startup Unconference Bangalore", category: "TECH" as const,
      description: "No keynotes. No PowerPoints. Just founders, investors, and builders in raw, unfiltered conversations. The Startup Unconference is where real decisions get made. 200 founders in a room for 8 hours. Bring your hardest problems.",
      venue: "BHIVE Workspace", city: "Bangalore", address: "Brigade Road, Bangalore 560001",
      lat: 12.9719, lng: 77.6083, startAt: FUTURE(5), endAt: FUTURE(5), isPublished: true, isFeatured: false,
      bannerUrl: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1400&q=80",
      tiers: [
        { name: "Founder Pass", type: "FREE" as const, price: 0, capacity: 100, sold: 87, sortOrder: 0 },
        { name: "Investor Pass", type: "VIP" as const, price: 4999, capacity: 50, sold: 34, sortOrder: 1 },
      ],
    },
    {
      organiserId: organiser3.id, title: "Lucknow Food & Culture Festival", category: "FOOD" as const,
      description: "Awadhi cuisine meets modern gastronomy. The Lucknow Food & Culture Festival returns for its third edition — 80+ food stalls, live ghazal performances, and cooking masterclasses by Michelin-recognised chefs. Come hungry. Leave inspired.",
      venue: "Ambedkar Memorial Park", city: "Lucknow", address: "Dr B R Ambedkar Park, Gomti Nagar, Lucknow",
      lat: 26.8467, lng: 80.9462, startAt: FUTURE(25), endAt: FUTURE(27), isPublished: true, isFeatured: false,
      bannerUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1400&q=80",
      tiers: [
        { name: "Entry", type: "FREE" as const, price: 0, capacity: 2000, sold: 1456, sortOrder: 0 },
        { name: "Food Pass", type: "GENERAL" as const, price: 399, capacity: 500, sold: 312, sortOrder: 1 },
        { name: "Masterclass", type: "PREMIUM" as const, price: 1499, capacity: 30, sold: 24, sortOrder: 2 },
      ],
    },
    // Past event for reviews/history
    {
      organiserId: organiser1.id, title: "Magnetic Fields Alsisar 2024", category: "MUSIC" as const,
      description: "A musical journey through the Rajasthan desert. Magnetic Fields is where electronic music meets ancient architecture.",
      venue: "Alsisar Mahal", city: "Jaipur", address: "Alsisar, Rajasthan",
      lat: 27.1767, lng: 75.8156, startAt: PAST(60), endAt: PAST(57), isPublished: true, isFeatured: false,
      bannerUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1400&q=80",
      tiers: [
        { name: "Desert Pass", type: "GENERAL" as const, price: 4999, capacity: 500, sold: 487, sortOrder: 0 },
        { name: "Glamping + Pass", type: "VIP" as const, price: 12999, capacity: 50, sold: 50, sortOrder: 1 },
      ],
    },
  ];

  const createdEvents: { id: string; slug: string }[] = [];

  for (const eventData of eventsData) {
    const { tiers, ...rest } = eventData;
    const eventSlug = slug(rest.title);
    const event = await prisma.event.upsert({
      where: { slug: eventSlug },
      update: {},
      create: {
        ...rest,
        slug: eventSlug,
        tags: [],
        ticketTiers: {
          create: tiers.map((t) => ({
            name: t.name, type: t.type, price: t.price,
            capacity: t.capacity, sold: t.sold, sortOrder: t.sortOrder,
            earlyBirdPrice: (t as any).earlyBirdPrice,
          })),
        },
      },
    });
    createdEvents.push({ id: event.id, slug: event.slug });
    console.log(`  ✓ Event: ${rest.title}`);
  }

  // ── Seed some orders + tickets for the demo attendee ──────────────
  const firstEvent = await prisma.event.findFirst({
    where: { isPublished: true },
    include: { ticketTiers: true },
  });

  if (firstEvent && firstEvent.ticketTiers[0]) {
    const existingOrder = await prisma.order.findFirst({
      where: { buyerId: attendee1.id, eventId: firstEvent.id },
    });

    if (!existingOrder) {
      const tier = firstEvent.ticketTiers[0];
      const order = await prisma.order.create({
        data: {
          buyerId: attendee1.id,
          eventId: firstEvent.id,
          totalAmount: tier.price,
          platformFee: Math.round(tier.price * 0.03 * 100) / 100,
          status: "PAID",
          paymentId: "pay_demo_" + nanoid(8),
          paymentProvider: "razorpay",
          orderItems: { create: [{ tierId: tier.id, quantity: 1, unitPrice: tier.price }] },
        },
      });

      const ticketRef = `SP-DEMO-25-${nanoid(6).toUpperCase()}`;
      await prisma.ticket.create({
        data: {
          orderId: order.id,
          tierId: tier.id,
          attendeeName: attendee1.name!,
          attendeeEmail: attendee1.email!,
          qrCode: `demo-qr-${nanoid(16)}`,
          ticketRef,
          isCheckedIn: false,
        },
      });
      console.log("  ✓ Demo order + ticket for Priya Sharma");
    }
  }

  // ── Seed reviews for past event ────────────────────────────────────
  const pastEvent = await prisma.event.findFirst({
    where: { title: { contains: "Magnetic Fields" } },
  });

  if (pastEvent) {
    const reviewData = [
      { userId: attendee1.id, rating: 5, body: "Absolutely transformative experience. The desert setting, the music, the people — nothing compares." },
      { userId: attendee2.id, rating: 5, body: "Best weekend of my life. Alsisar Mahal as a venue is unreal. Already booked for 2025." },
      { userId: attendee3.id, rating: 4, body: "Incredible music lineup. Logistics could improve but the vibe more than makes up for it." },
    ];
    for (const r of reviewData) {
      await prisma.review.upsert({
        where: { userId_eventId: { userId: r.userId, eventId: pastEvent.id } },
        update: {},
        create: { ...r, eventId: pastEvent.id },
      });
    }
    console.log("  ✓ Reviews seeded");
  }

  // ── Discount codes for first upcoming event ────────────────────────
  if (createdEvents[0]) {
    const evId = createdEvents[0].id;
    await prisma.discountCode.upsert({
      where: { eventId_code: { eventId: evId, code: "SHOWPASS20" } },
      update: {},
      create: { eventId: evId, code: "SHOWPASS20", type: "PERCENT", value: 20, maxUses: 50, isActive: true },
    });
    await prisma.discountCode.upsert({
      where: { eventId_code: { eventId: evId, code: "FLAT200" } },
      update: {},
      create: { eventId: evId, code: "FLAT200", type: "FLAT", value: 200, maxUses: 100, isActive: true },
    });
    console.log("  ✓ Discount codes seeded");
  }

  console.log("\n✅ Seed complete!\n");
  console.log("Demo accounts:");
  console.log("  Organiser: organiser@showpass.demo / password123");
  console.log("  Attendee:  attendee@showpass.demo  / password123");
  console.log("  Admin:     admin@showpass.demo     / password123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
