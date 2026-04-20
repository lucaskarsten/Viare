import { auth } from "@/auth";
import { NextResponse } from "next/server";

const protectedPaths = [
  "/dashboard",
  "/learn",
  "/profile",
  "/settings",
  "/courses",
  "/certificates",
  "/discover",
  "/goals",
  "/review",
];
const adminPaths = ["/admin"];

export default auth((req) => {
  if (process.env.SKIP_AUTH === "true") return NextResponse.next();

  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user;
  const isProtected = protectedPaths.some((p) => nextUrl.pathname.startsWith(p));
  const isAdmin = adminPaths.some((p) => nextUrl.pathname.startsWith(p));

  if (isAdmin && session?.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
