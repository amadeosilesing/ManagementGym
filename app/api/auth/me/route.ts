import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ usuario: null }, { status: 401 })
    }
    return NextResponse.json({ usuario: session })
  } catch {
    return NextResponse.json({ usuario: null }, { status: 500 })
  }
}