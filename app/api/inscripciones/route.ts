import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { inscripciones, miembros, planes, pagos } from '@/lib/db/schema'
import { desc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { verifyToken } from '@/lib/auth/jwt'
import { cookies } from 'next/headers'

const inscripcionSchema = z.object({
  miembroId:  z.string().uuid('Miembro inválido'),
  planId:     z.string().uuid('Plan inválido'),
  fechaInicio: z.string().min(1, 'La fecha de inicio es requerida'),
  monto:      z.number().positive('El monto debe ser mayor a 0'),
  metodo:     z.enum(['efectivo', 'transferencia', 'tarjeta', 'otro']),
  notas:      z.string().optional(),
})

export async function GET() {
  try {
    const lista = await db
      .select({
        id:               inscripciones.id,
        fechaInicio:      inscripciones.fechaInicio,
        fechaVencimiento: inscripciones.fechaVencimiento,
        estado:           inscripciones.estado,
        notas:            inscripciones.notas,
        creadoEn:         inscripciones.creadoEn,
        miembroId:        miembros.id,
        miembroNombre:    miembros.nombre,
        miembroApellido:  miembros.apellido,
        miembroCi:        miembros.ci,
        planId:           planes.id,
        planNombre:       planes.nombre,
        planPrecio:       planes.precio,
        diasRestantes: sql<number>`
          (${inscripciones.fechaVencimiento}::date - CURRENT_DATE)
        `.as('dias_restantes'),
        estadoActual: sql<string>`
          CASE
            WHEN ${inscripciones.estado} = 'cancelado'                              THEN 'cancelado'
            WHEN ${inscripciones.estado} = 'suspendido'                             THEN 'suspendido'
            WHEN ${inscripciones.fechaVencimiento}::date < CURRENT_DATE             THEN 'vencido'
            WHEN ${inscripciones.fechaVencimiento}::date <= CURRENT_DATE + 7        THEN 'por_vencer'
            ELSE 'activo'
          END
        `.as('estado_actual'),
      })
      .from(inscripciones)
      .innerJoin(miembros, eq(inscripciones.miembroId, miembros.id))
      .innerJoin(planes,   eq(inscripciones.planId,    planes.id))
      .orderBy(desc(inscripciones.creadoEn))

    return NextResponse.json(lista)

  } catch (error) {
    console.error('[INSCRIPCIONES GET]', error)
    return NextResponse.json(
      { error: 'Error al obtener inscripciones' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    // Obtener usuario desde el token
    const cookieStore = await cookies()
    const token       = cookieStore.get('token')?.value
    const payload     = token ? await verifyToken(token) : null

    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body   = await req.json()
    const parsed = inscripcionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { miembroId, planId, fechaInicio, monto, metodo, notas } = parsed.data

    // Obtener duración del plan
    const [plan] = await db
      .select()
      .from(planes)
      .where(eq(planes.id, planId))
      .limit(1)

    if (!plan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })
    }

    // Calcular fecha de vencimiento
    const inicio      = new Date(fechaInicio)
    const vencimiento = new Date(inicio)
    vencimiento.setDate(vencimiento.getDate() + plan.duracionDias)

    const fechaVencimiento = vencimiento.toISOString().split('T')[0]

    // Crear inscripción y pago en una transacción
    const resultado = await db.transaction(async (tx) => {
      const [nuevaInscripcion] = await tx
        .insert(inscripciones)
        .values({
          miembroId,
          planId,
          registradoPor:    payload.id,
          fechaInicio:      fechaInicio,
          fechaVencimiento: fechaVencimiento,
          estado:           'activo',
          notas:            notas || null,
        })
        .returning()

      const [nuevoPago] = await tx
        .insert(pagos)
        .values({
          inscripcionId: nuevaInscripcion.id,
          monto:         String(monto),
          metodo,
          registradoPor: payload.id,
        })
        .returning()

      return { inscripcion: nuevaInscripcion, pago: nuevoPago }
    })

    return NextResponse.json(resultado, { status: 201 })

  } catch (error) {
    console.error('[INSCRIPCIONES POST]', error)
    return NextResponse.json(
      { error: 'Error al crear inscripción' },
      { status: 500 }
    )
  }
}