import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { inscripciones, miembros, pagos } from '@/lib/db/schema'
import { sql, count } from 'drizzle-orm'

export async function GET() {
  try {
    // Conteos de inscripciones por estado
    const [statsInscripciones] = await db.select({
      totalActivos: sql<number>`
        COUNT(*) FILTER (WHERE
          ${inscripciones.estado} NOT IN ('cancelado', 'suspendido') AND
          ${inscripciones.fechaVencimiento}::date >= CURRENT_DATE + 8
        )`,
      porVencer: sql<number>`
        COUNT(*) FILTER (WHERE
          ${inscripciones.estado} NOT IN ('cancelado', 'suspendido') AND
          ${inscripciones.fechaVencimiento}::date >= CURRENT_DATE AND
          ${inscripciones.fechaVencimiento}::date <= CURRENT_DATE + 7
        )`,
      vencidos: sql<number>`
        COUNT(*) FILTER (WHERE
          ${inscripciones.estado} NOT IN ('cancelado', 'suspendido') AND
          ${inscripciones.fechaVencimiento}::date < CURRENT_DATE
        )`,
      nuevosEsteMes: sql<number>`
        COUNT(*) FILTER (WHERE
          DATE_TRUNC('month', ${inscripciones.creadoEn}) = DATE_TRUNC('month', NOW())
        )`,
    }).from(inscripciones)

    // Total de miembros
    const [statsMiembros] = await db.select({
      total: count(),
    }).from(miembros)

    // Ingresos del mes actual
    const [statsIngresos] = await db.select({
      esteMes: sql<number>`
        COALESCE(SUM(${pagos.monto}) FILTER (WHERE
          DATE_TRUNC('month', ${pagos.fecha}) = DATE_TRUNC('month', NOW())
        ), 0)`,
      mesAnterior: sql<number>`
        COALESCE(SUM(${pagos.monto}) FILTER (WHERE
          DATE_TRUNC('month', ${pagos.fecha}) = DATE_TRUNC('month', NOW() - INTERVAL '1 month')
        ), 0)`,
    }).from(pagos)

    // Miembros por vencer (próximos 7 días) — detalle
    const porVencerDetalle = await db.select({
      id:               inscripciones.id,
      miembroId:        inscripciones.miembroId,
      miembroNombre:    miembros.nombre,
      miembroApellido:  miembros.apellido,
      miembroCi:        miembros.ci,
      fechaVencimiento: inscripciones.fechaVencimiento,
      diasRestantes:    sql<number>`
        (${inscripciones.fechaVencimiento}::date - CURRENT_DATE)
      `,
    })
    .from(inscripciones)
    .innerJoin(miembros, sql`${inscripciones.miembroId} = ${miembros.id}`)
    .where(sql`
      ${inscripciones.estado} NOT IN ('cancelado', 'suspendido') AND
      ${inscripciones.fechaVencimiento}::date >= CURRENT_DATE AND
      ${inscripciones.fechaVencimiento}::date <= CURRENT_DATE + 7
    `)
    .orderBy(sql`${inscripciones.fechaVencimiento}::date ASC`)

    // Ingresos últimos 6 meses
    const ingresosPorMes = await db.select({
      mes:   sql<string>`TO_CHAR(DATE_TRUNC('month', ${pagos.fecha}), 'Mon YYYY')`,
      total: sql<number>`SUM(${pagos.monto})`,
    })
    .from(pagos)
    .where(sql`${pagos.fecha} >= NOW() - INTERVAL '6 months'`)
    .groupBy(sql`DATE_TRUNC('month', ${pagos.fecha})`)
    .orderBy(sql`DATE_TRUNC('month', ${pagos.fecha}) ASC`)

    return NextResponse.json({
      inscripciones: {
        totalActivos:  Number(statsInscripciones.totalActivos),
        porVencer:     Number(statsInscripciones.porVencer),
        vencidos:      Number(statsInscripciones.vencidos),
        nuevosEsteMes: Number(statsInscripciones.nuevosEsteMes),
      },
      miembros: {
        total: Number(statsMiembros.total),
      },
      ingresos: {
        esteMes:     Number(statsIngresos.esteMes),
        mesAnterior: Number(statsIngresos.mesAnterior),
      },
      porVencerDetalle,
      ingresosPorMes,
    })

  } catch (error) {
    console.error('[DASHBOARD STATS]', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}