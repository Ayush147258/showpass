import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = token?.role;

  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL(`/auth?callbackUrl=${pathname}`, req.url));
    }
    if (role !== "ORGANISER" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL(`/auth?callbackUrl=${pathname}`, req.url));
    }
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  if (pathname.startsWith("/my-tickets") || pathname.startsWith("/checkout")) {
    if (!token) {
      return NextResponse.redirect(new URL(`/auth?callbackUrl=${pathname}`, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/my-tickets/:path*",
    "/checkout",
  ],
};
