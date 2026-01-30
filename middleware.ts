import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminSessionToken } from "@/utils/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin route protection
  if (pathname.startsWith("/admin")) {
    // Login page doesn't need authentication
    if (!pathname.startsWith("/admin/login")) {
      const sessionToken = request.cookies.get("admin_session")?.value;

      if (!sessionToken || !verifyAdminSessionToken(sessionToken)) {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
    }

    // Set pathname header for layout to use
    const response = NextResponse.next();
    response.headers.set("x-pathname", pathname);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
  ],
};
