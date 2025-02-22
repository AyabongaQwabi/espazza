import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Log all parameters for debugging
  console.log(
    'Callback parameters:',
    Object.fromEntries(requestUrl.searchParams)
  );

  // If there's an error, redirect to login with error message
  if (error) {
    console.error('Auth error:', error, errorDescription);
    const errorUrl = new URL('/login', requestUrl.origin);
    errorUrl.searchParams.set('error', error);
    errorUrl.searchParams.set('error_description', errorDescription || '');
    return NextResponse.redirect(errorUrl);
  }

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
      console.log('Authentication successful:', data);
      // Successful authentication - redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
    } catch (error) {
      // If code exchange fails, redirect to login with error
      console.error('Code exchange error:', error);
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
  console.log('No code or error, redirecting to home');
  return NextResponse.redirect(requestUrl.origin);
}
