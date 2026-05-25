import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { z } from "zod";
import type { EventCategory } from "@prisma/client";

// GET /api/events — list with filters
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") as EventCategory | null;
  const city = searchParams.get("city");
  const search = searchParams.get("search");
  const isFree = searchParams.get("free") === "true";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "12"), 48);

  try {
    const where: any = { isPublished: true };
    if (category) where.category = category;
    if (city) where.city = { contains: city, mode: "insensitive" };
    if (search) where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
      { venue: { contains: search, mode: "insensitive" } },
    ];
    if (isFree) where.ticketTiers = { some: { price: 0 } };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          organiser: { select: { id: true, name: true, image: true } },
          ticketTiers: { orderBy: { sortOrder: "asc" } },
          _count: { select: { reviews: true } },
        },
        orderBy: [{ isFeatured: "desc" }, { startAt: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.event.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: events, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Failed to fetch events" }, { status: 500 });
  }
}

const CreateEventSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(20),
  category: z.enum(["MUSIC","COLLEGE_FEST","TECH","COMEDY","FITNESS","FOOD","WORKSHOP","SPORTS","OTHER"]),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  venue: z.string().min(3),
  city: z.string().min(2),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  isOnline: z.boolean().default(false),
  onlineUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  tags: z.array(z.string()).default([]),
  tiers: z.array(z.object({
    name: z.string(),
    type: z.enum(["FREE","GENERAL","VIP","EARLY_BIRD","PREMIUM"]),
    price: z.number().min(0),
    capacity: z.number().min(1),
    description: z.string().optional(),
    earlyBirdPrice: z.number().optional(),
    earlyBirdEndsAt: z.string().datetime().optional(),
    sortOrder: z.number().default(0),
  })).min(1),
});

// POST /api/events — create event (organiser only)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ORGANISER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only organisers can create events" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = CreateEventSchema.parse(body);

    const event = await prisma.event.create({
      data: {
        organiserId: session.user.id,
        title: data.title,
        slug: slugify(data.title),
        description: data.description,
        category: data.category,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        venue: data.venue,
        city: data.city,
        address: data.address,
        lat: data.lat,
        lng: data.lng,
        isOnline: data.isOnline,
        onlineUrl: data.onlineUrl,
        bannerUrl: data.bannerUrl,
        tags: data.tags,
        isPublished: false,
        ticketTiers: {
          create: data.tiers.map((t) => ({
            name: t.name,
            type: t.type,
            price: t.price,
            capacity: t.capacity,
            description: t.description,
            earlyBirdPrice: t.earlyBirdPrice,
            earlyBirdEndsAt: t.earlyBirdEndsAt ? new Date(t.earlyBirdEndsAt) : undefined,
            sortOrder: t.sortOrder,
          })),
        },
      },
      include: { ticketTiers: true },
    });

    return NextResponse.json({ success: true, data: event }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: err.issues }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
