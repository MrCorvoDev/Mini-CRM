import {createServerClient} from '@supabase/ssr';
import {type NextRequest, NextResponse} from 'next/server';

export async function proxy(request: NextRequest) {
   let supabaseResponse = NextResponse.next({
      request,
   });

   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
   const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

   if (!supabaseUrl || !supabaseAnonKey) {
      return supabaseResponse;
   }

   const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
         getAll() {
            return request.cookies.getAll();
         },
         setAll(cookiesToSet) {
            cookiesToSet.forEach(({name, value}) => {
               request.cookies.set(name, value);
            });
            supabaseResponse = NextResponse.next({
               request,
            });
            cookiesToSet.forEach(({name, value, options}) => {
               supabaseResponse.cookies.set(name, value, options);
            });
         },
      },
   });

   // getUser checks auth and revalidates session token, updating cookies if refreshed
   const {
      data: {user},
   } = await supabase.auth.getUser();

   const redirectWithCookies = (pathname: string) => {
      const url = request.nextUrl.clone();
      url.pathname = pathname;
      const redirectResponse = NextResponse.redirect(url);
      supabaseResponse.cookies.getAll().forEach(cookie => {
         redirectResponse.cookies.set(cookie);
      });
      return redirectResponse;
   };

   const pathname = request.nextUrl.pathname;
   const isLoginPage = pathname === '/login';
   const isNavigationRequest =
      request.method === 'GET' || request.method === 'HEAD';

   // Protected routes: redirect to /login if unauthenticated
   const isProtectedRoute =
      pathname.startsWith('/sites') ||
      pathname.startsWith('/tasks') ||
      pathname === '/my-tasks';

   if (!user && isProtectedRoute) {
      return redirectWithCookies('/login');
   }

   // If already authenticated and opening /login, redirect to /sites.
   // Skip Server Action POSTs: they target the current /login URL and must
   // reach the action after signInWithPassword has just written cookies.
   if (user && isLoginPage && isNavigationRequest) {
      return redirectWithCookies('/sites');
   }

   return supabaseResponse;
}

export const config = {
   matcher: [
      '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
   ],
};
