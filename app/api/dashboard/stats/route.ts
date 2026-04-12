import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { inscripciones, miembros, pagos } from '@/lib/db/schema'
import { sql, count } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const hoy     = new Date()
    const mes     = parseInt(searchParams.get('mes')  || String(hoy.getMonth() + 1))
    const anio    = parseInt(searchParams.get('anio') || String(hoy.getFullYear()))

    // Rango del período seleccionado
    const inicioPeriodo = `${anio}-${String(mes).padStart(2, '0')}-01`
    const finPeriodo    = new Date(anio, mes, 0).toISOString().split('T')[0]

    // Rango del período anterior
    const fechaAnterior  = new Date(anio, mes - 2, 1)
    const inicioAnterior = `${fechaAnterior.getFullYear()}-${String(fechaAnterior.getMonth() + 1).padStart(2, '0')}-01`
    const finAnterior    = new Date(fechaAnterior.getFullYear(), fechaAnterior.getMonth() + 1, 0).toISOString().split('T')[0]

    // Stats de inscripciones del período
    const [statsInscripciones] = await db.select({
      nuevas: sql<number>`
        COUNT(*) FILTER (WHERE
          ${inscripciones.fechaInicio}::date >= ${inicioPeriodo}::date AND
          ${inscripciones.fechaInicio}::date <= ${finPeriodo}::date
        )`,
      activas: sql<number>`
        COUNT(*) FILTER (WHERE
          ${inscripciones.estado} NOT IN ('cancelado', 'suspendido') AND
          ${inscripciones.fechaInicio}::date <= ${finPeriodo}::date AND
          ${inscripciones.fechaVencimiento}::date >= ${inicioPeriodo}::date AND
          ${inscripciones.fechaVencimiento}::date >= CURRENT_DATE + 8
        )`,
      porVencer: sql<number>`
        COUNT(*) FILTER (WHERE
          ${inscripciones.estado} NOT IN ('cancelado', 'suspendido') AND
          ${inscripciones.fechaVencimiento}::date >= CURRENT_DATE AND
          ${inscripciones.fechaVencimiento}::date <= CURRENT_DATE + 7
        )`,
      vencidas: sql<number>`
        COUNT(*) FILTER (WHERE
          ${inscripciones.estado} NOT IN ('cancelado', 'suspendido') AND
          ${inscripciones.fechaVencimiento}::date < CURRENT_DATE
        )`,
      nuevasAnterior: sql<number>`
        COUNT(*) FILTER (WHERE
          ${inscripciones.fechaInicio}::date >= ${inicioAnterior}::date AND
          ${inscripciones.fechaInicio}::date <= ${finAnterior}::date
        )`,
    }).from(inscripciones)

    // Total miembros
    const [statsMiembros] = await db.select({
      total: count(),
    }).from(miembros)

    // Ingresos del período
    const [statsIngresos] = await db.select({
      total: sql<number>`
        COALESCE(SUM(${pagos.monto}) FILTER (WHERE
          ${pagos.fecha}::date >= ${inicioPeriodo}::date AND
          ${pagos.fecha}::date <= ${finPeriodo}::date
        ), 0)`,
      anterior: sql<number>`
        COALESCE(SUM(${pagos.monto}) FILTER (WHERE
          ${pagos.fecha}::date >= ${inicioAnterior}::date AND
          ${pagos.fecha}::date <= ${finAnterior}::date
        ), 0)`,
      efectivo: sql<number>`
        COALESCE(SUM(${pagos.monto}) FILTER (WHERE
          ${pagos.metodo} = 'efectivo' AND
          ${pagos.fecha}::date >= ${inicioPeriodo}::date AND
          ${pagos.fecha}::date <= ${finPeriodo}::date
        ), 0)`,
      transferencia: sql<number>`
        COALESCE(SUM(${pagos.monto}) FILTER (WHERE
          ${pagos.metodo} = 'transferencia' AND
          ${pagos.fecha}::date >= ${inicioPeriodo}::date AND
          ${pagos.fecha}::date <= ${finPeriodo}::date
        ), 0)`,
      tarjeta: sql<number>`
        COALESCE(SUM(${pagos.monto}) FILTER (WHERE
          ${pagos.metodo} = 'tarjeta' AND
          ${pagos.fecha}::date >= ${inicioPeriodo}::date AND
          ${pagos.fecha}::date <= ${finPeriodo}::date
        ), 0)`,
    }).from(pagos)

    // Miembros por vencer esta semana
    const porVencerDetalle = await db.select({
      id:               inscripciones.id,
      miembroId:        inscripciones.miembroId,
      miembroNombre:    miembros.nombre,
      miembroApellido:  miembros.apellido,
      miembroCi:        miembros.ci,
      fechaVencimiento: inscripciones.fechaVencimiento,
      diasRestantes:    sql<number>`(${inscripciones.fechaVencimiento}::date - CURRENT_DATE)`,
    })
    .from(inscripciones)
    .innerJoin(miembros, sql`${inscripciones.miembroId} = ${miembros.id}`)
    .where(sql`
      ${inscripciones.estado} NOT IN ('cancelado', 'suspendido') AND
      ${inscripciones.fechaVencimiento}::date >= CURRENT_DATE AND
      ${inscripciones.fechaVencimiento}::date <= CURRENT_DATE + 7
    `)
    .orderBy(sql`${inscripciones.fechaVencimiento}::date ASC`)

    // Ingresos por día del período seleccionado
    const ingresosPorDia = await db.select({
      dia:   sql<string>`TO_CHAR(${pagos.fecha}::date, 'DD')`,
      total: sql<number>`SUM(${pagos.monto})`,
    })
    .from(pagos)
    .where(sql`
      ${pagos.fecha}::date >= ${inicioPeriodo}::date AND
      ${pagos.fecha}::date <= ${finPeriodo}::date
    `)
    .groupBy(sql`${pagos.fecha}::date`)
    .orderBy(sql`${pagos.fecha}::date ASC`)

    // Inscripciones por día del período
    const inscripcionesPorDia = await db.select({
      dia:   sql<string>`TO_CHAR(${inscripciones.fechaInicio}::date, 'DD')`,
      total: sql<number>`COUNT(*)`,
    })
    .from(inscripciones)
    .where(sql`
      ${inscripciones.fechaInicio}::date >= ${inicioPeriodo}::date AND
      ${inscripciones.fechaInicio}::date <= ${finPeriodo}::date
    `)
    .groupBy(sql`${inscripciones.fechaInicio}::date`)
    .orderBy(sql`${inscripciones.fechaInicio}::date ASC`)

    const variacionIngresos = Number(statsIngresos.anterior) > 0
      ? ((Number(statsIngresos.total) - Number(statsIngresos.anterior)) / Number(statsIngresos.anterior) * 100).toFixed(1)
      : null

    const variacionInscripciones = Number(statsInscripciones.nuevasAnterior) > 0
      ? ((Number(statsInscripciones.nuevas) - Number(statsInscripciones.nuevasAnterior)) / Number(statsInscripciones.nuevasAnterior) * 100).toFixed(1)
      : null

    return NextResponse.json({
      periodo: { mes, anio, inicioPeriodo, finPeriodo },
      inscripciones: {
        nuevas:          Number(statsInscripciones.nuevas),
        activas:         Number(statsInscripciones.activas),
        porVencer:       Number(statsInscripciones.porVencer),
        vencidas:        Number(statsInscripciones.vencidas),
        nuevasAnterior:  Number(statsInscripciones.nuevasAnterior),
        variacion:       variacionInscripciones,
      },
      miembros: {
        total: Number(statsMiembros.total),
      },
      ingresos: {
        total:         Number(statsIngresos.total),
        anterior:      Number(statsIngresos.anterior),
        efectivo:      Number(statsIngresos.efectivo),
        transferencia: Number(statsIngresos.transferencia),
        tarjeta:       Number(statsIngresos.tarjeta),
        variacion:     variacionIngresos,
      },
      porVencerDetalle,
      ingresosPorDia,
      inscripcionesPorDia,
    })

  } catch (error) {
    console.error('[DASHBOARD STATS]', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}