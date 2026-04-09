import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './lib/auth/jwt'

const PUBLIC_ROUTES = ['/login']

// Rutas exclusivas de admin
const ADMIN_ONLY_ROUTES = [
  '/planes',
  '/usuarios',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic     = PUBLIC_ROUTES.some(route => pathname.startsWith(route))
  const token        = request.cookies.get('token')?.value

  if (isPublic && token) {
    const payload = await verifyToken(token)
    if (payload) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  if (!isPublic) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const payload = await verifyToken(token)

    if (!payload) {
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('token')
      return response
    }

    // Verificar rutas de solo admin
    const isAdminRoute = ADMIN_ONLY_ROUTES.some(route => pathname.startsWith(route))
    if (isAdminRoute && payload.rol !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}