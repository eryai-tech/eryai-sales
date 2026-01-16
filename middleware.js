// middleware.js
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name, options) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Publika routes som inte kräver auth
  const publicRoutes = ['/login'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // MFA routes
  const isMfaRoute = pathname.startsWith('/mfa');

  // Om ej inloggad och försöker nå skyddad route → redirect till login
  if (!user && !isPublicRoute && !isMfaRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Om inloggad och på login-sidan → redirect till leads
  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/leads', request.url));
  }

  // Om användaren är på MFA-sidor men inte är inloggad
  if (!user && isMfaRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ✨ MFA-checks för skyddade routes (endast /leads)
  if (user && pathname.startsWith('/leads')) {
    try {
      // Hämta MFA factors
      const { data: factors } = await supabase.auth.mfa.listFactors();
      
      // Kolla om användaren har MFA uppsatt
      const hasMFA = factors?.totp && factors.totp.length > 0;
      
      if (hasMFA) {
        // Använd getAuthenticatorAssuranceLevel för att kolla AAL
        const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        
        // Om currentLevel inte är aal2, redirecta till verify
        if (aalData?.currentLevel !== 'aal2') {
          return NextResponse.redirect(new URL('/mfa/verify', request.url));
        }
      }
      // Om ingen MFA uppsatt, låt användaren passera till /leads
      // (de kommer behöva sätta upp MFA vid nästa login)
      
    } catch (err) {
      console.error('Middleware MFA check error:', err);
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
