import { SignJWT, jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET as string)
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h'

export interface JWTPayload {
  id:     string
  nombre: string
  email:  string
  rol:    'admin' | 'recepcionista'
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(EXPIRES_IN)
    .setIssuedAt()
    .sign(SECRET)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as JWTPayload
  } catch (err) {
    console.error('[JWT] Error verificando token:', err)
    return null
  }
}