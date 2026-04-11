import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { miembros } from '@/lib/db/schema'
import { ilike, or, desc, count, sql } from 'drizzle-orm'
import { z } from 'zod'

const miembroSchema = z.object({
  nombre:          z.string().min(1, 'El nombre es requerido'),
  apellido:        z.string().min(1, 'El apellido es requerido'),
  ci:              z.string().min(1, 'El CI es requerido'),
  telefono:        z.string().optional(),
  email:           z.string().email('Email inválido').optional().or(z.literal('')),
  fechaNacimiento: z.string().optional(),
  genero:          z.enum(['masculino', 'femenino', 'otro']).optional(),
  notas:           z.string().optional(),
})

const LIMIT = 10

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const estado = searchParams.get('estado') || 'todos'
    const page   = Math.max(1, parseInt(searchParams.get('page')  || '1'))
    const limit  = Math.max(1, parseInt(searchParams.get('limit') || String(LIMIT)))
    const offset = (page - 1) * limit

    const searchCondition = search
      ? or(
          ilike(miembros.nombre,   `%${search}%`),
          ilike(miembros.apellido, `%${search}%`),
          ilike(miembros.ci,       `%${search}%`),
        )
      : undefined

    const estadoCondition = estado === 'activo'
      ? sql`${miembros.activo} = true`
      : estado === 'inactivo'
      ? sql`${miembros.activo} = false`
      : undefined

    const conditions = [searchCondition, estadoCondition].filter(Boolean)
    const whereClause = conditions.length > 0
      ? sql`${conditions.reduce((acc, cond) => sql`${acc} AND ${cond}`)}`
      : undefined

    const [{ total }] = await db
      .select({ total: count() })
      .from(miembros)
      .$dynamic()
      .where(whereClause as never)

    const [conteos] = await db
      .select({
        todos:    sql<number>`COUNT(*)`,
        activos:  sql<number>`COUNT(*) FILTER (WHERE ${miembros.activo} = true)`,
        inactivos: sql<number>`COUNT(*) FILTER (WHERE ${miembros.activo} = false)`,
      })
      .from(miembros)

    const lista = await db
      .select()
      .from(miembros)
      .$dynamic()
      .where(whereClause as never)
      .orderBy(desc(miembros.creadoEn))
      .limit(limit)
      .offset(offset)

    return NextResponse.json({
      data:       lista,
      total:      Number(total),
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit),
      conteos: {
        todos:    Number(conteos.todos),
        activo:   Number(conteos.activos),
        inactivo: Number(conteos.inactivos),
      },
    })

  } catch (error) {
    console.error('[MIEMBROS GET]', error)
    return NextResponse.json(
      { error: 'Error al obtener miembros' },
      { status: 500 }
    )
  }
}

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
        telefono:        data.telefono    || null,
        email:           data.email       || null,
        fechaNacimiento: data.fechaNacimiento || null,
        genero:          data.genero      || null,
        notas:           data.notas       || null,
      })
      .returning()

    return NextResponse.json(nuevo, { status: 201 })

  } catch (error: unknown) {
    console.error('[MIEMBROS POST]', error)
    if (
      typeof error === 'object' && error !== null &&
      'code' in error && (error as { code: string }).code === '23505'
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