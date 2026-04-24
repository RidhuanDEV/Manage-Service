import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// In-memory rate limiter (per IP — resets on cold start)
// Login: 20 req / 15 menit | Register: 15 req / 1 jam
// ---------------------------------------------------------------------------

type RateEntry = { count: number; resetAt: number };
const rateLimitStore = new Map<string, RateEntry>();

function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true; // allowed
  }

  if (entry.count >= maxRequests) return false; // blocked

  entry.count++;
  return true; // allowed
}

function getClientIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

// ---------------------------------------------------------------------------
// Route groups
// ---------------------------------------------------------------------------

const PROTECTED_PATHS = ["/dashboard", "/reports", "/admin"];
const ADMIN_PATHS = ["/admin"];
const AUTH_PATHS = ["/login", "/register"];

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!session;
  const pathname = nextUrl.pathname;

  const ip = getClientIP(req);

  // Rate limit — /api/auth/callback/credentials (login)
  if (
    pathname === "/api/auth/callback/credentials" ||
    pathname === "/api/auth/signin"
  ) {
    const allowed = checkRateLimit(
      `login:${ip}`,
      20,
      15 * 60 * 1000 // 20 req / 15 menit
    );
    if (!allowed) {
      return Response.json(
        { sukses: false, pesan: "Terlalu banyak permintaan, coba lagi dalam beberapa saat" },
        { status: 429 }
      );
    }
  }

  // Rate limit — /register
  if (pathname === "/register") {
    const allowed = checkRateLimit(
      `register:${ip}`,
      15,
      60 * 60 * 1000 // 15 req / 1 jam
    );
    if (!allowed) {
      return NextResponse.redirect(new URL("/register?error=rate_limit", nextUrl));
    }
  }

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Protect authenticated routes
  if (!isLoggedIn && PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    const callbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl)
    );
  }

  // Admin-only routes — require manage_users permission
  if (isLoggedIn && ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    const permissions: string[] = session.user.permissions ?? [];
    if (!permissions.includes("manage_users")) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match everything except static files, Next.js internals, and favicons
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js)).*)",
  ],
};
