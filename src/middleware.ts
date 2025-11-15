import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get auth token from cookies
  const authToken = request.cookies.get("authToken")?.value;
  const userRole = request.cookies.get("user-role")?.value;

  // Public routes
  const publicRoutes = ["/login", "/register", "/", "/about"];
  const isPublicRoute = publicRoutes.some((route) => pathname === route);

  // Auth routes
  const authRoutes = ["/login", "/register"];
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Protected route patterns
  const protectedRoutes = {
    customer: "/c/",
    admin: "/a/",
    worker: "/w/",
  };

  // Check which type of protected route is being accessed
  const isCustomerRoute = pathname.startsWith(protectedRoutes.customer);
  const isAdminRoute = pathname.startsWith(protectedRoutes.admin);
  const isWorkerRoute = pathname.startsWith(protectedRoutes.worker);
  const isProtectedRoute = isCustomerRoute || isAdminRoute || isWorkerRoute;

  // Allow access to public routes without authentication
  if (isPublicRoute && !authToken) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login (except for public routes)
  if (!authToken && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (authToken && isAuthRoute) {
    const dashboardUrl = getDashboardUrl(userRole);
    return NextResponse.redirect(new URL(dashboardUrl, request.url));
  }

  // Role-based access control for protected routes
  if (authToken && isProtectedRoute) {
    if (isAdminRoute && userRole !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    if (isWorkerRoute && userRole !== "autoworker") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    if (isCustomerRoute && userRole !== "user") {
      const dashboardUrl = getDashboardUrl(userRole);
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }
  }

  return NextResponse.next();
}

function getDashboardUrl(role: string | undefined): string {
  switch (role) {
    case "admin":
      return "/a/dashboard";
    case "autoworker":
      return "/w/dashboard";
    case "user":
    default:
      return "/c/dashboard";
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
