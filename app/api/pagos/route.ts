import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pagos, inscripciones, miembros, planes, usuarios } from '@/lib/db/schema'
import { desc, eq, sql } from 'drizzle-orm'

export async function GET() {
  try {
    const lista = await db
      .select({
        id:              pagos.id,
        monto:           pagos.monto,
        metodo:          pagos.metodo,
        referencia:      pagos.referencia,
        fecha:           pagos.fecha,
        inscripcionId:   pagos.inscripcionId,
        miembroNombre:   miembros.nombre,
        miembroApellido: miembros.apellido,
        miembroCi:       miembros.ci,
        planNombre:      planes.nombre,
        registradoPor:   usuarios.nombre,
        mesAnio: sql<string>`TO_CHAR(${pagos.fecha}, 'Mon YYYY')`,
      })
      .from(pagos)
      .innerJoin(inscripciones, eq(pagos.inscripcionId,   inscripciones.id))
      .innerJoin(miembros,      eq(inscripciones.miembroId, miembros.id))
      .innerJoin(planes,        eq(inscripciones.planId,    planes.id))
      .innerJoin(usuarios,      eq(pagos.registradoPor,    usuarios.id))
      .orderBy(desc(pagos.fecha))

    return NextResponse.json(lista)

  } catch (error) {
    console.error('[PAGOS GET]', error)
    return NextResponse.json(
      { error: 'Error al obtener pagos' },
      { status: 500 }
    )
  }
}