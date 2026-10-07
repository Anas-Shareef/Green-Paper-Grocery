import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If environment variables are not yet configured, gracefully skip auth session update
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
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

  // Refresh auth token
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const devRole = request.cookies.get('baqqala_dev_role')?.value
    const isDevAdmin = devRole && ['owner', 'admin', 'staff'].includes(devRole)

    // Protected admin route check
    if (request.nextUrl.pathname.startsWith('/admin') && !user && !isDevAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('next', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
  } catch {
    const devRole = request.cookies.get('baqqala_dev_role')?.value
    const isDevAdmin = devRole && ['owner', 'admin', 'staff'].includes(devRole)
    if (request.nextUrl.pathname.startsWith('/admin') && !isDevAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('next', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
