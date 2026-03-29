import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET!
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h'

export interface JWTPayload {
  id:     string
  nombre: string
  email:  string
  rol:    'admin' | 'recepcionista'
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, SECRET) as JWTPayload
  } catch {
    return null
  }
}