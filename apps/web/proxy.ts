import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

export const { auth } = NextAuth(authConfig);

const publicRoutes = ["/", "/login", "/signup", "/join"];
const publicApiPrefixes = ["/api/auth", "/api/attempts", "/api/code"]; // Exclude organizer APIs

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const { pathname } = req.nextUrl;

    const isApiRoute = pathname.startsWith("/api");

    // Determine if the route is an organizer API route
    const isOrganizerApiRoute = isApiRoute &&
        !pathname.startsWith("/api/auth") &&
        !pathname.startsWith("/api/attempts") &&
        !pathname.startsWith("/api/code") &&
        // Protect all specific Organizer APIs per instruction
        (
            pathname.startsWith("/api/assessments") ||
            pathname.startsWith("/api/questions") ||
            pathname.startsWith("/api/events") ||
            pathname.startsWith("/api/candidates") ||
            pathname.startsWith("/api/results") ||
            pathname.startsWith("/api/reports") ||
            pathname.startsWith("/api/dashboard") ||
            pathname.startsWith("/api/system-health")
        );

    const isPublicUIRoute = publicRoutes.some(r => pathname === r || pathname.startsWith(r + "/"));
    const isCandidateExamRoute = pathname.startsWith("/exam");

    // Protect Organizer APIs
    if (isOrganizerApiRoute) {
        if (!isLoggedIn) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.next();
    }

    // Unprotected APIs (auth endpoints, candidate endpoints)
    if (isApiRoute) {
        return NextResponse.next();
    }

    // Protect Organizer Dashboard Routes
    if (!isPublicUIRoute && !isCandidateExamRoute) {
        if (!isLoggedIn) {
            return Response.redirect(new URL("/login", req.nextUrl));
        }
    }

    return NextResponse.next();
});

export const config = {
    // Invoke middleware on all paths except static files and images
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
