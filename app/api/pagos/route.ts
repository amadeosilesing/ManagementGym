import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pagos, inscripciones, miembros, planes, usuarios } from '@/lib/db/schema'
import { desc, eq, ilike, or, sql, count } from 'drizzle-orm'

const LIMIT = 10

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const metodo = searchParams.get('metodo') || 'todos'
    const page   = Math.max(1, parseInt(searchParams.get('page')  || '1'))
    const limit  = Math.max(1, parseInt(searchParams.get('limit') || String(LIMIT)))
    const offset = (page - 1) * limit

    const searchCondition = search
      ? or(
          ilike(miembros.nombre,   `%${search}%`),
          ilike(miembros.apellido, `%${search}%`),
          ilike(miembros.ci,       `%${search}%`),
          ilike(planes.nombre,     `%${search}%`),
        )
      : undefined

    const metodoCondition = metodo !== 'todos'
      ? sql`${pagos.metodo} = ${metodo}`
      : undefined

    const conditions  = [searchCondition, metodoCondition].filter(Boolean)
    const whereClause = conditions.length > 0
      ? sql`${conditions.reduce((acc, cond) => sql`${acc} AND ${cond}`)}`
      : undefined

    // Total paginado
    const [{ total }] = await db
      .select({ total: count() })
      .from(pagos)
      .innerJoin(inscripciones, eq(pagos.inscripcionId,    inscripciones.id))
      .innerJoin(miembros,      eq(inscripciones.miembroId, miembros.id))
      .innerJoin(planes,        eq(inscripciones.planId,    planes.id))
      .$dynamic()
      .where(whereClause as never)

    // Conteos y totales por método
    const [stats] = await db
      .select({
        totalGeneral:      sql<number>`COALESCE(SUM(${pagos.monto}), 0)`,
        totalEfectivo:     sql<number>`COALESCE(SUM(${pagos.monto}) FILTER (WHERE ${pagos.metodo} = 'efectivo'), 0)`,
        totalTransferencia: sql<number>`COALESCE(SUM(${pagos.monto}) FILTER (WHERE ${pagos.metodo} = 'transferencia'), 0)`,
        totalTarjeta:      sql<number>`COALESCE(SUM(${pagos.monto}) FILTER (WHERE ${pagos.metodo} = 'tarjeta'), 0)`,
        countTodos:        sql<number>`COUNT(*)`,
        countEfectivo:     sql<number>`COUNT(*) FILTER (WHERE ${pagos.metodo} = 'efectivo')`,
        countTransferencia: sql<number>`COUNT(*) FILTER (WHERE ${pagos.metodo} = 'transferencia')`,
        countTarjeta:      sql<number>`COUNT(*) FILTER (WHERE ${pagos.metodo} = 'tarjeta')`,
      })
      .from(pagos)
      .innerJoin(inscripciones, eq(pagos.inscripcionId,    inscripciones.id))
      .innerJoin(miembros,      eq(inscripciones.miembroId, miembros.id))
      .innerJoin(planes,        eq(inscripciones.planId,    planes.id))

    // Lista paginada
    const lista = await db
      .select({
        id:              pagos.id,
        monto:           pagos.monto,
        metodo:          pagos.metodo,
        referencia:      pagos.referencia,
        fecha:           pagos.fecha,
        miembroNombre:   miembros.nombre,
        miembroApellido: miembros.apellido,
        miembroCi:       miembros.ci,
        planNombre:      planes.nombre,
        registradoPor:   usuarios.nombre,
      })
      .from(pagos)
      .innerJoin(inscripciones, eq(pagos.inscripcionId,    inscripciones.id))
      .innerJoin(miembros,      eq(inscripciones.miembroId, miembros.id))
      .innerJoin(planes,        eq(inscripciones.planId,    planes.id))
      .innerJoin(usuarios,      eq(pagos.registradoPor,    usuarios.id))
      .$dynamic()
      .where(whereClause as never)
      .orderBy(desc(pagos.fecha))
      .limit(limit)
      .offset(offset)

    return NextResponse.json({
      data:       lista,
      total:      Number(total),
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit),
      conteos: {
        todos:         Number(stats.countTodos),
        efectivo:      Number(stats.countEfectivo),
        transferencia: Number(stats.countTransferencia),
        tarjeta:       Number(stats.countTarjeta),
      },
      totales: {
        general:       Number(stats.totalGeneral),
        efectivo:      Number(stats.totalEfectivo),
        transferencia: Number(stats.totalTransferencia),
        tarjeta:       Number(stats.totalTarjeta),
      },
    })

  } catch (error) {
    console.error('[PAGOS GET]', error)
    return NextResponse.json(
      { error: 'Error al obtener pagos' },
      { status: 500 }
    )
  }
}