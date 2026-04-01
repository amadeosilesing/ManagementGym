import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { planes } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'

const planSchema = z.object({
  nombre:       z.string().min(1, 'El nombre es requerido'),
  descripcion:  z.string().optional(),
  duracionDias: z.number().int().positive('La duración debe ser mayor a 0'),
  precio:       z.number().positive('El precio debe ser mayor a 0'),
})

export async function GET() {
  try {
    const lista = await db
      .select()
      .from(planes)
      .orderBy(desc(planes.creadoEn))

    return NextResponse.json(lista)

  } catch (error) {
    console.error('[PLANES GET]', error)
    return NextResponse.json(
      { error: 'Error al obtener planes' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json()
    const parsed = planSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const [nuevo] = await db
      .insert(planes)
      .values({
        nombre:       parsed.data.nombre,
        descripcion:  parsed.data.descripcion || null,
        duracionDias: parsed.data.duracionDias,
        precio:       String(parsed.data.precio),
      })
      .returning()

    return NextResponse.json(nuevo, { status: 201 })

  } catch (error) {
    console.error('[PLANES POST]', error)
    return NextResponse.json(
      { error: 'Error al crear plan' },
      { status: 500 }
    )
  }
}