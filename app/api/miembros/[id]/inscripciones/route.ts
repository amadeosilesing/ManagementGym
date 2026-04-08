import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { inscripciones, planes, pagos, usuarios } from '@/lib/db/schema'
import { eq, desc, sql } from 'drizzle-orm'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const lista = await db
      .select({
        id:               inscripciones.id,
        fechaInicio:      inscripciones.fechaInicio,
        fechaVencimiento: inscripciones.fechaVencimiento,
        estado:           inscripciones.estado,
        notas:            inscripciones.notas,
        creadoEn:         inscripciones.creadoEn,
        planNombre:       planes.nombre,
        planPrecio:       planes.precio,
        planDias:         planes.duracionDias,
        registradoPor:    usuarios.nombre,
        diasRestantes: sql<number>`
          (${inscripciones.fechaVencimiento}::date - CURRENT_DATE)
        `,
        estadoActual: sql<string>`
          CASE
            WHEN ${inscripciones.estado} = 'cancelado'                         THEN 'cancelado'
            WHEN ${inscripciones.estado} = 'suspendido'                        THEN 'suspendido'
            WHEN ${inscripciones.fechaVencimiento}::date < CURRENT_DATE        THEN 'vencido'
            WHEN ${inscripciones.fechaVencimiento}::date <= CURRENT_DATE + 7   THEN 'por_vencer'
            ELSE 'activo'
          END
        `,
        totalPagado: sql<number>`
          COALESCE((
            SELECT SUM(p.monto)
            FROM pagos p
            WHERE p.inscripcion_id = ${inscripciones.id}
          ), 0)
        `,
      })
      .from(inscripciones)
      .innerJoin(planes,   eq(inscripciones.planId,       planes.id))
      .innerJoin(usuarios, eq(inscripciones.registradoPor, usuarios.id))
      .where(eq(inscripciones.miembroId, id))
      .orderBy(desc(inscripciones.creadoEn))

    return NextResponse.json(lista)

  } catch (error) {
    console.error('[MIEMBRO INSCRIPCIONES GET]', error)
    return NextResponse.json(
      { error: 'Error al obtener inscripciones' },
      { status: 500 }
    )
  }
}