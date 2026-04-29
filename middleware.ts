import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const isApi = req.nextUrl.pathname.startsWith("/api/");
    const hasToken = !!req.nextauth.token;

    if (!hasToken) {
      if (isApi) {
        return new NextResponse(
          JSON.stringify({ error: "Unauthorized Access. Token Missing." }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
      // For non-API routes, redirect to login
      return NextResponse.redirect(new URL("/login", req.url));
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      // Let the middleware function run for all matched routes
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: [
    // Protect all routes under /dashboard
    "/dashboard/:path*",
    
    // Protect all API routes, explicitly excluding /api/auth using regex negative lookahead
    "/api/((?!auth).*)"
  ],
};
