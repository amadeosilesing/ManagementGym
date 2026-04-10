import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { usuarios } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { getSession, isAdmin } from '@/lib/auth/session'
import bcrypt from 'bcryptjs'

const updateSchema = z.object({
  nombre:   z.string().min(1).optional(),
  rol:      z.enum(['admin', 'recepcionista']).optional(),
  activo:   z.boolean().optional(),
  password: z.string().min(6).optional(),
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

    // Evitar que el admin se desactive a sí mismo
    if (parsed.data.activo === false && session?.id === id) {
      return NextResponse.json(
        { error: 'No puedes desactivarte a ti mismo' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {
      actualizadoEn: new Date(),
    }

    if (parsed.data.nombre)   updateData.nombre = parsed.data.nombre
    if (parsed.data.rol)      updateData.rol    = parsed.data.rol
    if (parsed.data.activo !== undefined) updateData.activo = parsed.data.activo
    if (parsed.data.password) {
      updateData.passwordHash = await bcrypt.hash(parsed.data.password, 12)
    }

    const [actualizado] = await db
      .update(usuarios)
      .set(updateData)
      .where(eq(usuarios.id, id))
      .returning({
        id:       usuarios.id,
        nombre:   usuarios.nombre,
        email:    usuarios.email,
        rol:      usuarios.rol,
        activo:   usuarios.activo,
        creadoEn: usuarios.creadoEn,
      })

    if (!actualizado) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(actualizado)

  } catch (error) {
    console.error('[USUARIO PUT]', error)
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    )
  }
}