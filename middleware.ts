import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
    // A list of all locales that are supported
    locales: ['en', 'si', 'ta'],

    // Used when no locale matches
    defaultLocale: 'en'
});

export default function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    // Skip API routes, static files, and files with extensions
    if (
        pathname.startsWith('/api') ||
        pathname.startsWith('/_next') ||
        pathname.includes('.') ||
        pathname.startsWith('/favicon.ico')
    ) {
        return NextResponse.next();
    }

    // Check if pathname already has a locale prefix
    const hasLocale = /^\/(en|si|ta)(\/|$)/.test(pathname);
    
    // If root path, allow it to show language selection page (don't redirect)
    if (pathname === '/') {
        return NextResponse.next();
    }
    
    // If path doesn't have locale prefix and is not root, redirect to ?redirect=path
    if (!hasLocale) {
        const redirectPath = pathname.startsWith('/') ? pathname.slice(1) : pathname;
        const url = request.nextUrl.clone();
        url.pathname = '/';
        url.searchParams.set('redirect', redirectPath);
        return NextResponse.redirect(url);
    }
    
    // Otherwise, let next-intl handle it
    return intlMiddleware(request);
}

export const config = {
    // Match all pathnames except API routes, static files, and Next.js internals
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
