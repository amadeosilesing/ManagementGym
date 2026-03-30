import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { miembros } from '@/lib/db/schema'
import { ilike, or, desc } from 'drizzle-orm'
import { z } from 'zod'

const miembroSchema = z.object({
  nombre:          z.string().min(1, 'El nombre es requerido'),
  apellido:        z.string().min(1, 'El apellido es requerido'),
  ci:              z.string().min(1, 'El CI es requerido'),
  telefono:        z.string().optional(),
  email:           z.string().email('Email inválido').optional().or(z.literal('')),
  fechaNacimiento: z.string().optional(),
  notas:           z.string().optional(),
  genero:          z.enum(['masculino', 'femenino', 'otro']).optional(),
})

// GET — listar miembros con búsqueda opcional
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''

    const lista = search
      ? await db
          .select()
          .from(miembros)
          .where(
            or(
              ilike(miembros.nombre,   `%${search}%`),
              ilike(miembros.apellido, `%${search}%`),
              ilike(miembros.ci,       `%${search}%`),
            )
          )
          .orderBy(desc(miembros.creadoEn))
      : await db
          .select()
          .from(miembros)
          .orderBy(desc(miembros.creadoEn))

    return NextResponse.json(lista)

  } catch (error) {
    console.error('[MIEMBROS GET]', error)
    return NextResponse.json(
      { error: 'Error al obtener miembros' },
      { status: 500 }
    )
  }
}

// POST — crear miembro
export async function POST(req: NextRequest) {
  try {
    const body   = await req.json()
    const parsed = miembroSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const data = parsed.data

    const [nuevo] = await db
      .insert(miembros)
      .values({
        nombre:          data.nombre,
        apellido:        data.apellido,
        ci:              data.ci,
        telefono:        data.telefono || null,
        email:           data.email    || null,
        fechaNacimiento: data.fechaNacimiento || null,
        notas:           data.notas    || null,
        genero:          data.genero   || null,
      })
      .returning()

    return NextResponse.json(nuevo, { status: 201 })

  } catch (error: unknown) {
    console.error('[MIEMBROS POST]', error)

    // CI duplicado
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === '23505'
    ) {
      return NextResponse.json(
        { error: 'Ya existe un miembro con ese CI' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Error al crear miembro' },
      { status: 500 }
    )
  }
}