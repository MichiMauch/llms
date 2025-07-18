import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Check if user is accessing admin routes
    if (req.nextUrl.pathname.startsWith('/admin')) {
      // Allow access to login and error pages
      if (req.nextUrl.pathname === '/admin/login' || req.nextUrl.pathname === '/admin/error') {
        return NextResponse.next();
      }
      
      // Check if user has netnode.ch email
      if (!req.nextauth.token?.email?.endsWith('@netnode.ch')) {
        return NextResponse.redirect(new URL('/admin/login', req.url));
      }
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to non-admin routes
        if (!req.nextUrl.pathname.startsWith('/admin')) {
          return true;
        }
        
        // Allow access to login and error pages
        if (req.nextUrl.pathname === '/admin/login' || req.nextUrl.pathname === '/admin/error') {
          return true;
        }
        
        // For admin routes, check if user has valid token and netnode.ch email
        return !!token && !!token.email?.endsWith('@netnode.ch');
      },
    },
  }
);

export const config = {
  matcher: ['/admin/:path*']
};