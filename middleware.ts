import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { DEMO_COOKIE_NAME, DEMO_COOKIE_VALUE } from '@/app/actions/demo-constants'

// ── In-memory rate limiter (resets on cold start; good enough for Edge/Node) ──
// For production at scale, swap the Map for an Upstash Redis store.
const loginAttempts = new Map<string, { count: number; resetAt: number }>()

const RATE_LIMIT_MAX      = 10   // max attempts
const RATE_LIMIT_WINDOW   = 15 * 60 * 1000  // 15 minutes in ms
const RATE_LIMIT_LOCKOUT  = 30 * 60 * 1000  // 30 minute lockout after max attempts

function getRateLimitKey(request: NextRequest): string {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  return `login:${ip}`
}

function checkRateLimit(key: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now()
  const record = loginAttempts.get(key)

  if (!record || now > record.resetAt) {
    // First attempt or window expired
    loginAttempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return { allowed: true, retryAfterSeconds: 0 }
  }

  if (record.count >= RATE_LIMIT_MAX) {
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000)
    return { allowed: false, retryAfterSeconds }
  }

  record.count++
  return { allowed: true, retryAfterSeconds: 0 }
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')
  // Prevent MIME sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  // Referrer policy — don't leak URL to third parties
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  // Basic CSP — tighten per your actual CDN/font/script sources
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // tighten after audit
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      `connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL}`,
      "frame-ancestors 'none'",
    ].join('; ')
  )
  // HSTS — browsers will only use HTTPS for 1 year
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  return response
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // ── Rate-limit login POST requests ────────────────────────────────────────
  if (request.nextUrl.pathname === '/login' && request.method === 'POST') {
    const key = getRateLimitKey(request)
    const { allowed, retryAfterSeconds } = checkRateLimit(key)
    if (!allowed) {
      const response = new NextResponse(
        JSON.stringify({ error: 'Too many login attempts. Please try again later.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
      response.headers.set('Retry-After', String(retryAfterSeconds))
      addSecurityHeaders(response)
      return response
    }
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(
              name,
              value,
              options as Parameters<typeof supabaseResponse.cookies.set>[2]
            )
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const isDemoSession =
    request.cookies.get(DEMO_COOKIE_NAME)?.value === DEMO_COOKIE_VALUE

  const publicRoutes = ['/landing', '/login', '/request-access', '/auth']
  const isPublicRoute = publicRoutes.some(
    route =>
      pathname === route ||
      pathname.startsWith(route + '/') ||
      pathname.startsWith(route)
  )

  const protectedRoutes = ['/', '/obligations', '/evidence', '/kyc', '/sar', '/audit-report', '/settings']
  const isProtectedRoute = protectedRoutes.some(
    route => pathname === route || pathname.startsWith(route + '/')
  )

  // Logged-in user hitting /login → send to dashboard
  if ((user || isDemoSession) && pathname === '/login') {
    return addSecurityHeaders(NextResponse.redirect(new URL('/', request.url)))
  }

  // Not logged in, trying to reach a protected route → send to landing
  if (!user && !isDemoSession && isProtectedRoute) {
    return addSecurityHeaders(NextResponse.redirect(new URL('/landing', request.url)))
  }

  return addSecurityHeaders(supabaseResponse)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}