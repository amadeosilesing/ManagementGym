import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './lib/auth/jwt'

// Rutas que NO requieren autenticación
const PUBLIC_ROUTES = ['/login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_ROUTES.some(route => pathname.startsWith(route))

  const token = request.cookies.get('token')?.value

  // Si la ruta es pública y tiene token → redirige al dashboard
  if (isPublic && token) {
    const payload = verifyToken(token)
    if (payload) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Si la ruta es privada y no tiene token → redirige al login
  if (!isPublic) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    const payload = verifyToken(token)
    if (!payload) {
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('token')
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}