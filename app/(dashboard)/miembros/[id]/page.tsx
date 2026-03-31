'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'

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

export default function PerfilMiembroPage() {
  const { id }  = useParams()
  const router  = useRouter()

  const [miembro,   setMiembro]   = useState<Miembro | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [editando,  setEditando]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [formError, setFormError] = useState('')

  async function fetchMiembro() {
    try {
      const res = await fetch(`/api/miembros/${id}`)
      if (!res.ok) throw new Error('No encontrado')
      const data = await res.json()
      setMiembro(data)
    } catch {
      setError('No se pudo cargar el miembro')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMiembro()
  }, [id])

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

      if (!res.ok) {
        setFormError(result.error || 'Error al actualizar')
        return
      }

      setMiembro(result)
      setEditando(false)

    } catch {
      setFormError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  async function handleDesactivar() {
    if (!confirm('¿Estás seguro de desactivar este miembro?')) return

    try {
      const res = await fetch(`/api/miembros/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ activo: false }),
      })
      if (!res.ok) throw new Error()
      await fetchMiembro()
    } catch {
      alert('Error al desactivar')
    }
  }

  async function handleReactivar() {
    if (!confirm('¿Reactivar este miembro?')) return

    try {
      const res = await fetch(`/api/miembros/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ activo: true }),
      })
      if (!res.ok) throw new Error()
      await fetchMiembro()
    } catch {
      alert('Error al reactivar')
    }
  }

  async function handleEliminar() {
    if (!confirm('¿Eliminar permanentemente este miembro? Esta acción no se puede deshacer.')) return

    try {
      const res = await fetch(`/api/miembros/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      router.push('/miembros')
    } catch {
      alert('Error al eliminar')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Cargando...
      </div>
    )
  }

  if (error || !miembro) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-gray-500 text-sm">{error || 'Miembro no encontrado'}</p>
        <button
          onClick={() => router.push('/miembros')}
          className="text-sm text-[#185FA5] hover:underline"
        >
          Volver a miembros
        </button>
      </div>
    )
  }

  const generoLabel: Record<string, string> = {
    masculino: 'Masculino',
    femenino:  'Femenino',
    otro:      'Otro',
  }

  return (
    <>
      <Header
        titulo={`${miembro.nombre} ${miembro.apellido}`}
        subtitulo={`CI: ${miembro.ci}`}
      >
        <button
          onClick={() => router.push('/miembros')}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-xl
                     hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Volver
        </button>
        {!editando && (
          <button
            onClick={() => setEditando(true)}
            className="px-4 py-2 text-sm font-semibold text-white bg-[#185FA5]
                       hover:bg-[#0C447C] rounded-xl transition-colors cursor-pointer"
          >
            Editar
          </button>
        )}
      </Header>

      <div className="max-w-2xl flex flex-col gap-5">

        {/* Badge estado */}
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium
            ${miembro.activo
              ? 'bg-green-50 text-green-700'
              : 'bg-gray-100 text-gray-500'
            }`}>
            {miembro.activo ? 'Activo' : 'Inactivo'}
          </span>
          <span className="text-xs text-gray-400">
            Registrado el {new Date(miembro.creadoEn).toLocaleDateString('es-BO', {
              day: '2-digit', month: 'long', year: 'numeric'
            })}
          </span>
        </div>

        {/* Card info / form edición */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">

          {editando ? (
            <form onSubmit={handleUpdate} className="flex flex-col gap-5">

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Nombre</label>
                  <input
                    name="nombre"
                    type="text"
                    required
                    defaultValue={miembro.nombre}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm
                               text-gray-900 bg-white focus:outline-none focus:border-blue-500
                               focus:ring-2 focus:ring-blue-100 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Apellido</label>
                  <input
                    name="apellido"
                    type="text"
                    required
                    defaultValue={miembro.apellido}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm
                               text-gray-900 bg-white focus:outline-none focus:border-blue-500
                               focus:ring-2 focus:ring-blue-100 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Teléfono</label>
                  <input
                    name="telefono"
                    type="tel"
                    defaultValue={miembro.telefono || ''}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm
                               text-gray-900 bg-white focus:outline-none focus:border-blue-500
                               focus:ring-2 focus:ring-blue-100 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={miembro.email || ''}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm
                               text-gray-900 bg-white focus:outline-none focus:border-blue-500
                               focus:ring-2 focus:ring-blue-100 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Fecha de nacimiento</label>
                  <input
                    name="fechaNacimiento"
                    type="date"
                    defaultValue={miembro.fechaNacimiento || ''}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm
                               text-gray-900 bg-white focus:outline-none focus:border-blue-500
                               focus:ring-2 focus:ring-blue-100 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Género</label>
                  <select
                    name="genero"
                    defaultValue={miembro.genero || ''}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm
                               text-gray-900 bg-white focus:outline-none focus:border-blue-500
                               focus:ring-2 focus:ring-blue-100 transition-colors"
                  >
                    <option value="">Sin especificar</option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Notas internas</label>
                <textarea
                  name="notas"
                  rows={3}
                  defaultValue={miembro.notas || ''}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm
                             text-gray-900 bg-white focus:outline-none focus:border-blue-500
                             focus:ring-2 focus:ring-blue-100 transition-colors resize-none"
                />
              </div>

              {formError && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                  <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10"/>
                    <path strokeLinecap="round" d="M12 8v4M12 16h.01"/>
                  </svg>
                  <p className="text-sm text-red-600">{formError}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditando(false)}
                  className="px-5 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-xl
                             hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-[#185FA5]
                             hover:bg-[#0C447C] disabled:bg-blue-300 rounded-xl
                             transition-colors cursor-pointer"
                >
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

        {/* Zona de acciones */}
        {!editando && (
          <div className="bg-white rounded-2xl border border-red-100 p-5 flex flex-col gap-4">

            {/* Activar / Desactivar */}
            {miembro.activo ? (
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">Desactivar miembro</p>
                <p className="text-xs text-gray-500 mb-3">
                  El miembro no podrá ser inscrito hasta que sea reactivado. Su historial se conservará.
                </p>
                <button
                  onClick={handleDesactivar}
                  className="px-4 py-2 text-sm font-medium text-amber-600 border border-amber-200
                             rounded-xl hover:bg-amber-50 transition-colors cursor-pointer"
                >
                  Desactivar miembro
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">Reactivar miembro</p>
                <p className="text-xs text-gray-500 mb-3">
                  El miembro volverá a estar disponible para nuevas inscripciones.
                </p>
                <button
                  onClick={handleReactivar}
                  className="px-4 py-2 text-sm font-medium text-green-600 border border-green-200
                             rounded-xl hover:bg-green-50 transition-colors cursor-pointer"
                >
                  Reactivar miembro
                </button>
              </div>
            )}

            {/* Separador */}
            <div className="border-t border-red-100" />

            {/* Eliminar permanente */}
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">Eliminar miembro</p>
              <p className="text-xs text-gray-500 mb-3">
                Esta acción es permanente y no se puede deshacer. Se eliminará todo el registro.
              </p>
              <button
                onClick={handleEliminar}
                className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200
                           rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
              >
                Eliminar permanentemente
              </button>
            </div>

          </div>
        )}

      </div>
    </>
  )
}