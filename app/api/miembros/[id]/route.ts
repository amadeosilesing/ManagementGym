import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { miembros } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const updateSchema = z.object({
  nombre:          z.string().min(1).optional(),
  apellido:        z.string().min(1).optional(),
  telefono:        z.string().optional(),
  email:           z.string().email().optional().or(z.literal('')),
  fechaNacimiento: z.string().optional(),
  notas:           z.string().optional(),
  activo:          z.boolean().optional(),
})

// GET — obtener un miembro por id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [miembro] = await db
      .select()
      .from(miembros)
      .where(eq(miembros.id, id))
      .limit(1)

    if (!miembro) {
      return NextResponse.json(
        { error: 'Miembro no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(miembro)

  } catch (error) {
    console.error('[MIEMBRO GET]', error)
    return NextResponse.json(
      { error: 'Error al obtener miembro' },
      { status: 500 }
    )
  }
}

// PUT — actualizar miembro
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id }  = await params
    const body    = await req.json()
    const parsed  = updateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const [actualizado] = await db
      .update(miembros)
      .set({
        ...parsed.data,
        actualizadoEn: new Date(),
      })
      .where(eq(miembros.id, id))
      .returning()

    if (!actualizado) {
      return NextResponse.json(
        { error: 'Miembro no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(actualizado)

  } catch (error) {
    console.error('[MIEMBRO PUT]', error)
    return NextResponse.json(
      { error: 'Error al actualizar miembro' },
      { status: 500 }
    )
  }
}

// DELETE — desactivar miembro (soft delete)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [desactivado] = await db
      .update(miembros)
      .set({ activo: false, actualizadoEn: new Date() })
      .where(eq(miembros.id, id))
      .returning()

    if (!desactivado) {
      return NextResponse.json(
        { error: 'Miembro no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error('[MIEMBRO DELETE]', error)
    return NextResponse.json(
      { error: 'Error al desactivar miembro' },
      { status: 500 }
    )
  }
}