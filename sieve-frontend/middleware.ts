import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("sieve_token")?.value || 
                request.headers.get("Authorization")?.replace("Bearer ", "");

  const isAuthPage = request.nextUrl.pathname === "/login";
  const isPublic = request.nextUrl.pathname === "/";

  if (!token && !isAuthPage && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};