import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { inscripciones } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const updateSchema = z.object({
  estado: z.enum(['activo', 'vencido', 'suspendido', 'cancelado']).optional(),
  notas:  z.string().optional(),
})

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
      .update(inscripciones)
      .set({ ...parsed.data, actualizadoEn: new Date() })
      .where(eq(inscripciones.id, id))
      .returning()

    if (!actualizado) {
      return NextResponse.json(
        { error: 'Inscripción no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(actualizado)

  } catch (error) {
    console.error('[INSCRIPCION PUT]', error)
    return NextResponse.json(
      { error: 'Error al actualizar inscripción' },
      { status: 500 }
    )
  }
}