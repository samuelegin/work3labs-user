import { NextResponse } from 'next/server'

export function middleware(request) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('w3l_user_auth')?.value

  const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/pod') || pathname.startsWith('/profile')
  const isAuthRoute  = pathname.startsWith('/auth/')

  // if (isProtected && !token) {
  //   const url = request.nextUrl.clone()
  //   url.pathname = '/auth/login'
  //   url.searchParams.set('from', pathname)
  //   return NextResponse.redirect(url)
  // }

  // if (isAuthRoute && token && !pathname.includes('/signup')) {
  //   const url = request.nextUrl.clone()
  //   url.pathname = '/dashboard'
  //   return NextResponse.redirect(url)
  // }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/pod/:path*', '/profile/:path*', '/auth/:path*'],
}
