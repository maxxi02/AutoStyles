// // middleware.ts
// import { NextRequest, NextResponse } from "next/server";

// export function middleware(request: NextRequest) {
//   const roleCookie = request.cookies.get("user-role")?.value;
//   const pathname = request.nextUrl.pathname;

//   // If no role cookie, redirect to login (assuming a login page exists)
//   if (!roleCookie) {
//     return NextResponse.redirect(new URL("/login", request.url));
//   }

//   const role = roleCookie as "user" | "admin";

//   // Role-based redirects
//   if (pathname.startsWith("/a/") && role !== "admin") {
//     return NextResponse.redirect(new URL("/c/dashboard", request.url));
//   }

//   if (pathname.startsWith("/c/") && role === "admin") {
//     return NextResponse.redirect(new URL("/a/dashboard", request.url));
//   }

//   // Allow the request to proceed
//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/a/:path*", "/c/:path*"],
// };
