import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/admin/refunds — list refund requests with status filter
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // PENDING | APPROVED | REJECTED
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;

  try {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [refunds, total, pendingCount] = await Promise.all([
      prisma.refundRequest.findMany({
        where,
        include: {
          order: {
            include: {
              buyer: { select: { id: true, name: true, email: true, image: true } },
              event: { select: { id: true, title: true, slug: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.refundRequest.count({ where }),
      prisma.refundRequest.count({ where: { status: "PENDING" } }),
    ]);

    return NextResponse.json({
      success: true,
      data: refunds,
      total,
      pendingCount,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[Admin/Refunds/LIST]", err);
    return NextResponse.json({ error: "Failed to fetch refunds" }, { status: 500 });
  }
}
