import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAppRoute = req.nextUrl.pathname.startsWith("/dashboard") ||
    req.nextUrl.pathname.startsWith("/bugs") ||
    req.nextUrl.pathname.startsWith("/inbox") ||
    req.nextUrl.pathname.startsWith("/assistant") ||
    req.nextUrl.pathname.startsWith("/social") ||
    req.nextUrl.pathname.startsWith("/analytics");

  if (isAppRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
