import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { miembros, inscripciones, pagos } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { getSession, isAdmin } from '@/lib/auth/session'

const updateSchema = z.object({
  nombre:          z.string().min(1).optional(),
  apellido:        z.string().min(1).optional(),
  telefono:        z.string().optional(),
  email:           z.string().email().optional().or(z.literal('')),
  fechaNacimiento: z.string().optional(),
  genero:          z.string().optional(),
  notas:           z.string().optional(),
  activo:          z.boolean().optional(),
})

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

    // Solo admin puede desactivar/reactivar
    if (parsed.data.activo !== undefined) {
      const session = await getSession()
      if (!isAdmin(session)) {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 403 }
        )
      }
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!isAdmin(session)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const { id } = await params

    await db.transaction(async (tx) => {
      const inscripcionesMiembro = await tx
        .select({ id: inscripciones.id })
        .from(inscripciones)
        .where(eq(inscripciones.miembroId, id))

      for (const insc of inscripcionesMiembro) {
        await tx
          .delete(pagos)
          .where(eq(pagos.inscripcionId, insc.id))
      }

      await tx
        .delete(inscripciones)
        .where(eq(inscripciones.miembroId, id))

      await tx
        .delete(miembros)
        .where(eq(miembros.id, id))
    })

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error('[MIEMBRO DELETE]', error)
    return NextResponse.json(
      { error: 'Error al eliminar miembro' },
      { status: 500 }
    )
  }
}