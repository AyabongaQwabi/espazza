import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // If there's an error, redirect to login with error message
  if (error) {
    const errorUrl = new URL('/login', requestUrl.origin);
    errorUrl.searchParams.set('error', error);
    errorUrl.searchParams.set('error_description', errorDescription || '');
    return NextResponse.redirect(errorUrl);
  }

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    try {
      await supabase.auth.exchangeCodeForSession(code);
      // Successful authentication - redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
    } catch (error) {
      // If code exchange fails, redirect to login with error
      const errorUrl = new URL('/login', requestUrl.origin);
      errorUrl.searchParams.set('error', 'auth_error');
      errorUrl.searchParams.set(
        'error_description',
        'Authentication failed. Please try again.'
      );
      return NextResponse.redirect(errorUrl);
    }
  }

  // No code or error - redirect to home
  return NextResponse.redirect(requestUrl.origin);
}
