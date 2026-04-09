'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { useSession } from '@/lib/auth/client-session'

interface Miembro {
  id:              string
  nombre:          string
  apellido:        string
  ci:              string
  telefono:        string | null
  email:           string | null
  fechaNacimiento: string | null
  genero:          string | null
  notas:           string | null
  activo:          boolean
  creadoEn:        string
}

interface Inscripcion {
  id:               string
  planNombre:       string
  planPrecio:       string
  planDias:         number
  fechaInicio:      string
  fechaVencimiento: string
  estadoActual:     string
  diasRestantes:    number
  totalPagado:      number
  registradoPor:    string
  creadoEn:         string
}

interface Plan {
  id:           string
  nombre:       string
  duracionDias: number
  precio:       string
  activo:       boolean
}

const estadoConfig: Record<string, { label: string; clase: string }> = {
  activo:     { label: 'Activo',     clase: 'bg-green-50 text-green-700'  },
  por_vencer: { label: 'Por vencer', clase: 'bg-amber-50 text-amber-700'  },
  vencido:    { label: 'Vencido',    clase: 'bg-red-50 text-red-600'      },
  suspendido: { label: 'Suspendido', clase: 'bg-gray-100 text-gray-500'   },
  cancelado:  { label: 'Cancelado',  clase: 'bg-gray-100 text-gray-500'   },
}

export default function PerfilMiembroPage() {
  const { id }            = useParams()
  const router            = useRouter()
  const { session }       = useSession()
  const esAdmin           = session?.rol === 'admin'

  const [miembro,        setMiembro]        = useState<Miembro | null>(null)
  const [inscripciones,  setInscripciones]  = useState<Inscripcion[]>([])
  const [planes,         setPlanes]         = useState<Plan[]>([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState('')
  const [editando,       setEditando]       = useState(false)
  const [saving,         setSaving]         = useState(false)
  const [formError,      setFormError]      = useState('')
  const [modalRenovar,   setModalRenovar]   = useState(false)
  const [planId,         setPlanId]         = useState('')
  const [monto,          setMonto]          = useState('')
  const [metodo,         setMetodo]         = useState('efectivo')
  const [renovando,      setRenovando]      = useState(false)
  const [renovarError,   setRenovarError]   = useState('')

  const inscripcionActual = inscripciones[0] ?? null

  const planSeleccionado = planes.find((p) => p.id === planId)

  const fechaVencimientoPreview = planSeleccionado
    ? (() => {
        const hoy = new Date()
        hoy.setHours(0, 0, 0, 0)

        let inicio: Date

        if (inscripcionActual) {
          const vencimientoActual = new Date(inscripcionActual.fechaVencimiento)
          vencimientoActual.setHours(0, 0, 0, 0)
          if (vencimientoActual >= hoy) {
            inicio = new Date(vencimientoActual)
            inicio.setDate(inicio.getDate() + 1)
          } else {
            inicio = hoy
          }
        } else {
          inicio = hoy
        }

        const vencimiento = new Date(inicio)
        vencimiento.setDate(vencimiento.getDate() + planSeleccionado.duracionDias)
        return vencimiento.toISOString().split('T')[0]
      })()
    : ''

  async function fetchData() {
    try {
      const [resMiembro, resInscripciones, resPlanes] = await Promise.all([
        fetch(`/api/miembros/${id}`),
        fetch(`/api/miembros/${id}/inscripciones`),
        fetch('/api/planes'),
      ])
      const [dataMiembro, dataInscripciones, dataPlanes] = await Promise.all([
        resMiembro.json(),
        resInscripciones.json(),
        resPlanes.json(),
      ])
      setMiembro(dataMiembro)
      setInscripciones(dataInscripciones)
      setPlanes(dataPlanes.filter((p: Plan) => p.activo))
    } catch {
      setError('No se pudo cargar el miembro')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  useEffect(() => {
    if (planSeleccionado) setMonto(planSeleccionado.precio)
  }, [planId])

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setFormError('')

    const form = e.currentTarget
    const data = {
      nombre:          (form.elements.namedItem('nombre')          as HTMLInputElement).value,
      apellido:        (form.elements.namedItem('apellido')        as HTMLInputElement).value,
      telefono:        (form.elements.namedItem('telefono')        as HTMLInputElement).value,
      email:           (form.elements.namedItem('email')           as HTMLInputElement).value,
      fechaNacimiento: (form.elements.namedItem('fechaNacimiento') as HTMLInputElement).value,
      genero:          (form.elements.namedItem('genero')          as HTMLSelectElement).value,
      notas:           (form.elements.namedItem('notas')           as HTMLTextAreaElement).value,
    }

    try {
      const res = await fetch(`/api/miembros/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) { setFormError(result.error || 'Error al actualizar'); return }
      setMiembro(result)
      setEditando(false)
    } catch {
      setFormError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  async function handleDesactivar() {
    if (!confirm('¿Desactivar este miembro?')) return
    try {
      await fetch(`/api/miembros/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: false }),
      })
      await fetchData()
    } catch { alert('Error al desactivar') }
  }

  async function handleReactivar() {
    if (!confirm('¿Reactivar este miembro?')) return
    try {
      await fetch(`/api/miembros/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: true }),
      })
      await fetchData()
    } catch { alert('Error al reactivar') }
  }

  async function handleRenovar(e: React.FormEvent) {
    e.preventDefault()
    setRenovando(true)
    setRenovarError('')

    try {
      const res = await fetch('/api/inscripciones/renovar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          miembroId: id,
          planId,
          monto:     parseFloat(monto),
          metodo,
        }),
      })
      const result = await res.json()
      if (!res.ok) { setRenovarError(result.error || 'Error al renovar'); return }
      setModalRenovar(false)
      setPlanId('')
      setMonto('')
      setMetodo('efectivo')
      await fetchData()
    } catch {
      setRenovarError('Error de conexión')
    } finally {
      setRenovando(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Cargando...</div>
  )

  if (error || !miembro) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <p className="text-gray-500 text-sm">{error || 'Miembro no encontrado'}</p>
      <button onClick={() => router.push('/miembros')} className="text-sm text-[#185FA5] hover:underline">
        Volver a miembros
      </button>
    </div>
  )

  const generoLabel: Record<string, string> = {
    masculino: 'Masculino', femenino: 'Femenino', otro: 'Otro',
  }

  const inputClass = `w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm
    text-gray-900 bg-white focus:outline-none focus:border-blue-500
    focus:ring-2 focus:ring-blue-100 transition-colors`

  return (
    <>
      <Header titulo={`${miembro.nombre} ${miembro.apellido}`} subtitulo={`CI: ${miembro.ci}`}>
        <button onClick={() => router.push('/miembros')}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-xl
                     hover:bg-gray-50 transition-colors cursor-pointer">
          Volver
        </button>
        {!editando && (
          <button onClick={() => setEditando(true)}
            className="px-4 py-2 text-sm font-semibold text-white bg-[#185FA5]
                       hover:bg-[#0C447C] rounded-xl transition-colors cursor-pointer">
            Editar
          </button>
        )}
      </Header>

      <div className="max-w-2xl flex flex-col gap-5">

        {/* Badge estado */}
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium
            ${miembro.activo ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {miembro.activo ? 'Activo' : 'Inactivo'}
          </span>
          <span className="text-xs text-gray-400">
            Registrado el {new Date(miembro.creadoEn).toLocaleDateString('es-BO', {
              day: '2-digit', month: 'long', year: 'numeric'
            })}
          </span>
        </div>

        {/* Membresía actual */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-900">Membresía actual</p>
            <button
              onClick={() => setModalRenovar(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white
                         bg-[#185FA5] hover:bg-[#0C447C] rounded-xl transition-colors cursor-pointer"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Renovar
            </button>
          </div>

          {inscripcionActual ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Plan</p>
                <p className="text-sm font-medium text-gray-900">{inscripcionActual.planNombre}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Estado</p>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium
                  ${estadoConfig[inscripcionActual.estadoActual]?.clase ?? 'bg-gray-100 text-gray-500'}`}>
                  {estadoConfig[inscripcionActual.estadoActual]?.label ?? inscripcionActual.estadoActual}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Inicio</p>
                <p className="text-sm text-gray-900">
                  {new Date(inscripcionActual.fechaInicio).toLocaleDateString('es-BO')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Vencimiento</p>
                <p className="text-sm text-gray-900">
                  {new Date(inscripcionActual.fechaVencimiento).toLocaleDateString('es-BO')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Días restantes</p>
                <p className={`text-sm font-semibold
                  ${inscripcionActual.diasRestantes < 0
                    ? 'text-red-500'
                    : inscripcionActual.diasRestantes <= 7
                    ? 'text-amber-600'
                    : 'text-gray-900'
                  }`}>
                  {inscripcionActual.diasRestantes < 0
                    ? `Venció hace ${Math.abs(inscripcionActual.diasRestantes)} días`
                    : `${inscripcionActual.diasRestantes} días`
                  }
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Total pagado</p>
                <p className="text-sm font-semibold text-gray-900">
                  Bs. {Number(inscripcionActual.totalPagado).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <p className="text-sm text-gray-400 mb-3">Sin membresía registrada</p>
              <button onClick={() => setModalRenovar(true)} className="text-sm text-[#185FA5] hover:underline">
                Crear primera inscripción
              </button>
            </div>
          )}
        </div>

        {/* Historial de inscripciones */}
        {inscripciones.length > 1 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-sm font-semibold text-gray-900 mb-4">Historial de membresías</p>
            <div className="flex flex-col gap-3">
              {inscripciones.slice(1).map((insc) => (
                <div key={insc.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{insc.planNombre}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(insc.fechaInicio).toLocaleDateString('es-BO')} →{' '}
                      {new Date(insc.fechaVencimiento).toLocaleDateString('es-BO')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      Bs. {Number(insc.totalPagado).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-lg font-medium
                      ${estadoConfig[insc.estadoActual]?.clase ?? 'bg-gray-100 text-gray-500'}`}>
                      {estadoConfig[insc.estadoActual]?.label ?? insc.estadoActual}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info del miembro */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <p className="text-sm font-semibold text-gray-900 mb-4">Información personal</p>

          {editando ? (
            <form onSubmit={handleUpdate} className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Nombre</label>
                  <input name="nombre" type="text" required defaultValue={miembro.nombre} className={inputClass}/>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Apellido</label>
                  <input name="apellido" type="text" required defaultValue={miembro.apellido} className={inputClass}/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Teléfono</label>
                  <input name="telefono" type="tel" defaultValue={miembro.telefono || ''} className={inputClass}/>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <input name="email" type="email" defaultValue={miembro.email || ''} className={inputClass}/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Fecha de nacimiento</label>
                  <input name="fechaNacimiento" type="date" defaultValue={miembro.fechaNacimiento || ''} className={inputClass}/>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Género</label>
                  <select name="genero" defaultValue={miembro.genero || ''} className={inputClass}>
                    <option value="">Sin especificar</option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Notas internas</label>
                <textarea name="notas" rows={3} defaultValue={miembro.notas || ''}
                  className={`${inputClass} resize-none`}/>
              </div>

              {formError && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-600">{formError}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditando(false)}
                  className="px-5 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-xl
                             hover:bg-gray-50 transition-colors cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-[#185FA5]
                             hover:bg-[#0C447C] disabled:bg-blue-300 rounded-xl transition-colors cursor-pointer">
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              {[
                { label: 'Nombre',             valor: miembro.nombre },
                { label: 'Apellido',           valor: miembro.apellido },
                { label: 'CI',                 valor: miembro.ci },
                { label: 'Teléfono',           valor: miembro.telefono || '—' },
                { label: 'Email',              valor: miembro.email    || '—' },
                { label: 'Género',             valor: generoLabel[miembro.genero || ''] || '—' },
                {
                  label: 'Fecha de nacimiento',
                  valor: miembro.fechaNacimiento
                    ? new Date(miembro.fechaNacimiento).toLocaleDateString('es-BO', {
                        day: '2-digit', month: 'long', year: 'numeric'
                      })
                    : '—'
                },
                { label: 'Notas', valor: miembro.notas || '—' },
              ].map(({ label, valor }) => (
                <div key={label}>
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  <p className="text-sm text-gray-900">{valor}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Zona de acciones — solo admin */}
        {!editando && esAdmin && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4">
            {miembro.activo ? (
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">Desactivar miembro</p>
                <p className="text-xs text-gray-500 mb-3">
                  El miembro no podrá ser inscrito hasta que sea reactivado. Su historial se conservará.
                </p>
                <button onClick={handleDesactivar}
                  className="px-4 py-2 text-sm font-medium text-amber-600 border border-amber-200
                             rounded-xl hover:bg-amber-50 transition-colors cursor-pointer">
                  Desactivar miembro
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">Reactivar miembro</p>
                <p className="text-xs text-gray-500 mb-3">
                  El miembro volverá a estar disponible para nuevas inscripciones.
                </p>
                <button onClick={handleReactivar}
                  className="px-4 py-2 text-sm font-medium text-green-600 border border-green-200
                             rounded-xl hover:bg-green-50 transition-colors cursor-pointer">
                  Reactivar miembro
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Modal renovar */}
      {modalRenovar && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
          onClick={(e) => e.target === e.currentTarget && setModalRenovar(false)}
        >
          <div className="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-md">

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">Renovar membresía</h2>
              <button onClick={() => setModalRenovar(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleRenovar} className="flex flex-col gap-4">

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Plan <span className="text-red-500">*</span>
                </label>
                <select required value={planId} onChange={(e) => setPlanId(e.target.value)} className={inputClass}>
                  <option value="">Seleccionar plan...</option>
                  {planes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} — {p.duracionDias} días — Bs. {parseFloat(p.precio).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              {fechaVencimientoPreview && (
                <div className="flex flex-col gap-1 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    <p className="text-sm text-blue-700">
                      {inscripcionActual && new Date(inscripcionActual.fechaVencimiento) >= new Date()
                        ? 'Se respetan los días restantes'
                        : 'Inicia desde hoy'
                      }
                    </p>
                  </div>
                  <p className="text-sm text-blue-700 pl-6">
                    Vence el <strong>{new Date(fechaVencimientoPreview).toLocaleDateString('es-BO', {
                      day: '2-digit', month: 'long', year: 'numeric'
                    })}</strong>
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Monto (Bs.) <span className="text-red-500">*</span>
                  </label>
                  <input type="number" required min={0} step="0.01" value={monto}
                    onChange={(e) => setMonto(e.target.value)} className={inputClass}/>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Método <span className="text-red-500">*</span>
                  </label>
                  <select value={metodo} onChange={(e) => setMetodo(e.target.value)} className={inputClass}>
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              {renovarError && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-600">{renovarError}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalRenovar(false)}
                  className="px-5 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-xl
                             hover:bg-gray-50 transition-colors cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" disabled={renovando}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-[#185FA5]
                             hover:bg-[#0C447C] disabled:bg-blue-300 rounded-xl transition-colors cursor-pointer">
                  {renovando ? 'Renovando...' : 'Confirmar renovación'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  )
}