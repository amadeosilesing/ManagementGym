import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { inscripciones, planes, pagos, miembros } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { z } from 'zod'
import { verifyToken } from '@/lib/auth/jwt'
import { cookies } from 'next/headers'

const renovarSchema = z.object({
  miembroId: z.string().uuid(),
  planId:    z.string().uuid(),
  monto:     z.number().positive(),
  metodo:    z.enum(['efectivo', 'transferencia', 'tarjeta', 'otro']),
  notas:     z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token       = cookieStore.get('token')?.value
    const payload     = token ? await verifyToken(token) : null

    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body   = await req.json()
    const parsed = renovarSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { miembroId, planId, monto, metodo, notas } = parsed.data

    // Obtener el plan
    const [plan] = await db
      .select()
      .from(planes)
      .where(eq(planes.id, planId))
      .limit(1)

    if (!plan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })
    }

    // Obtener la inscripción más reciente del miembro
    const [ultimaInscripcion] = await db
      .select()
      .from(inscripciones)
      .where(eq(inscripciones.miembroId, miembroId))
      .orderBy(desc(inscripciones.fechaVencimiento))
      .limit(1)

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    let fechaInicio: Date

    if (ultimaInscripcion) {
      const vencimientoActual = new Date(ultimaInscripcion.fechaVencimiento)
      vencimientoActual.setHours(0, 0, 0, 0)

      if (vencimientoActual >= hoy) {
        // Membresía vigente → inicia el día siguiente al vencimiento actual
        fechaInicio = new Date(vencimientoActual)
        fechaInicio.setDate(fechaInicio.getDate() + 1)
      } else {
        // Membresía vencida → inicia hoy
        fechaInicio = hoy
      }
    } else {
      // Sin inscripción previa → inicia hoy
      fechaInicio = hoy
    }

    // Calcular fecha de vencimiento
    const fechaVencimiento = new Date(fechaInicio)
    fechaVencimiento.setDate(fechaVencimiento.getDate() + plan.duracionDias)

    const fechaInicioStr     = fechaInicio.toISOString().split('T')[0]
    const fechaVencimientoStr = fechaVencimiento.toISOString().split('T')[0]

    // Crear inscripción y pago en transacción
    const resultado = await db.transaction(async (tx) => {
      const [nuevaInscripcion] = await tx
        .insert(inscripciones)
        .values({
          miembroId,
          planId,
          registradoPor:    payload.id,
          fechaInicio:      fechaInicioStr,
          fechaVencimiento: fechaVencimientoStr,
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
    console.error('[RENOVAR ERROR]', error)
    return NextResponse.json(
      { error: 'Error al renovar inscripción' },
      { status: 500 }
    )
  }
}