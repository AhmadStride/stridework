import { type NextRequest, NextResponse } from 'next/server'

// Middleware stripped down to passthrough — auth is handled in each server page.
// The Supabase edge middleware caused crashes on Netlify's edge runtime.
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
