import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Skip supabase initialization if no env variables exist (Graceful fallback)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl

  // Protected Routes Check
  // We want to force auth on '/' and '/admin' for the portal.
  const isAuthRoute = 
    url.pathname.startsWith('/login') || 
    url.pathname.startsWith('/auth') || 
    url.pathname.startsWith('/forgot-password') || 
    url.pathname.startsWith('/reset-password')
  
  if (!user && !isAuthRoute) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user is logged in, restrict auth routes (like /login)
  if (user && isAuthRoute) {
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // RBAC checks for Admin / Superuser will happen here or in page layouts
  if (user && url.pathname.startsWith('/admin')) {
    // Basic check: we will add `role` to user_metadata or fetch custom claims
    // but for now, we just ensure they are logged in. More strict RBAC to follow.
  }

  return supabaseResponse
}
