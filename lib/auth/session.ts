import { cookies } from 'next/headers'
import { verifyToken, JWTPayload } from './jwt'

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token       = cookieStore.get('token')?.value
  if (!token) return null
  return await verifyToken(token)
}

export function isAdmin(session: JWTPayload | null): boolean {
  return session?.rol === 'admin'
}

export function isRecepcionista(session: JWTPayload | null): boolean {
  return session?.rol === 'recepcionista'
}