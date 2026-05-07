import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "admin_token";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET");
  return new TextEncoder().encode(secret);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method;

  const isAdminPage = pathname.startsWith("/admin");
  const isMutationAPI =
    (pathname.startsWith("/api/plans") ||
      pathname.startsWith("/api/race") ||
      pathname.startsWith("/api/athletes")) &&
    method !== "GET";
  // Strava: protect connect-flow start + disconnect (admin only).
  // /api/strava/callback is PUBLIC because Strava browser redirects to it.
  // /api/strava/activities + /api/strava/status are PUBLIC read.
  const isStravaAdmin =
    pathname === "/api/strava/auth" ||
    pathname === "/api/strava/disconnect";

  if (!isAdminPage && !isMutationAPI && !isStravaAdmin) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    if (isAdminPage) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (payload.role !== "admin") throw new Error("Not admin");
    return NextResponse.next();
  } catch {
    if (isAdminPage) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/plans/:path*",
    "/api/race",
    "/api/athletes/:path*",
    "/api/strava/auth",
    "/api/strava/disconnect",
  ],
};
