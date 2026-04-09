import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { planes } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { getSession, isAdmin } from '@/lib/auth/session'

const updateSchema = z.object({
  nombre:       z.string().min(1).optional(),
  descripcion:  z.string().optional(),
  duracionDias: z.number().int().positive().optional(),
  precio:       z.number().positive().optional(),
  activo:       z.boolean().optional(),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id }  = await params
    const body    = await req.json()
    const parsed  = updateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {
      ...parsed.data,
      actualizadoEn: new Date(),
    }

    if (parsed.data.precio !== undefined) {
      updateData.precio = String(parsed.data.precio)
    }

    const [actualizado] = await db
      .update(planes)
      .set(updateData)
      .where(eq(planes.id, id))
      .returning()

    if (!actualizado) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(actualizado)

  } catch (error) {
    console.error('[PLAN PUT]', error)
    return NextResponse.json(
      { error: 'Error al actualizar plan' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id } = await params

    const [desactivado] = await db
      .update(planes)
      .set({ activo: false, actualizadoEn: new Date() })
      .where(eq(planes.id, id))
      .returning()

    if (!desactivado) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error('[PLAN DELETE]', error)
    return NextResponse.json(
      { error: 'Error al desactivar plan' },
      { status: 500 }
    )
  }
}