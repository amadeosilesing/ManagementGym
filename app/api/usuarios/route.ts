import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { usuarios } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { z } from 'zod'
import { getSession, isAdmin } from '@/lib/auth/session'
import bcrypt from 'bcryptjs'

const usuarioSchema = z.object({
  nombre:   z.string().min(1, 'El nombre es requerido'),
  email:    z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rol:      z.enum(['admin', 'recepcionista']),
})

export async function GET() {
  try {
    const session = await getSession()
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const lista = await db
      .select({
        id:           usuarios.id,
        nombre:       usuarios.nombre,
        email:        usuarios.email,
        rol:          usuarios.rol,
        activo:       usuarios.activo,
        creadoEn:     usuarios.creadoEn,
      })
      .from(usuarios)
      .orderBy(desc(usuarios.creadoEn))

    return NextResponse.json(lista)

  } catch (error) {
    console.error('[USUARIOS GET]', error)
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body   = await req.json()
    const parsed = usuarioSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { nombre, email, password, rol } = parsed.data

    const hash = await bcrypt.hash(password, 12)

    const [nuevo] = await db
      .insert(usuarios)
      .values({
        nombre,
        email,
        passwordHash: hash,
        rol,
      })
      .returning({
        id:       usuarios.id,
        nombre:   usuarios.nombre,
        email:    usuarios.email,
        rol:      usuarios.rol,
        activo:   usuarios.activo,
        creadoEn: usuarios.creadoEn,
      })

    return NextResponse.json(nuevo, { status: 201 })

  } catch (error: unknown) {
    console.error('[USUARIOS POST]', error)

    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === '23505'
    ) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con ese email' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    )
  }
}