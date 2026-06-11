import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_FILE = /\.(.*)$/;

export function middleware(request: NextRequest) {
  const password = process.env.APP_ACCESS_PASSWORD;

  if (!password) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || PUBLIC_FILE.test(pathname)) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Basic ")) {
    const encoded = authHeader.slice(6);
    const decoded = atob(encoded);
    const [, providedPassword] = decoded.split(":");

    if (providedPassword === password) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Team Tasks"',
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
