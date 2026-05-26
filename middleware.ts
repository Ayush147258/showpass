import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function hasSessionCookie(req: NextRequest) {
  return Boolean(
    req.cookies.get("authjs.session-token") ??
      req.cookies.get("__Secure-authjs.session-token") ??
      req.cookies.get("next-auth.session-token") ??
      req.cookies.get("__Secure-next-auth.session-token")
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!hasSessionCookie(req)) {
    return NextResponse.redirect(new URL(`/auth?callbackUrl=${pathname}`, req.url));
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
