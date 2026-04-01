'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'

interface Plan {
  id:           string
  nombre:       string
  descripcion:  string | null
  duracionDias: number
  precio:       string
  activo:       boolean
}

interface FormData {
  nombre:       string
  descripcion:  string
  duracionDias: string
  precio:       string
}

const formInicial: FormData = {
  nombre:       '',
  descripcion:  '',
  duracionDias: '',
  precio:       '',
}

export default function PlanesPage() {
  const [planes,     setPlanes]     = useState<Plan[]>([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(false)
  const [editPlan,   setEditPlan]   = useState<Plan | null>(null)
  const [form,       setForm]       = useState<FormData>(formInicial)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')

  async function fetchPlanes() {
    setLoading(true)
    try {
      const res  = await fetch('/api/planes')
      const data = await res.json()
      setPlanes(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPlanes() }, [])

  function abrirNuevo() {
    setEditPlan(null)
    setForm(formInicial)
    setError('')
    setModal(true)
  }

  function abrirEditar(plan: Plan) {
    setEditPlan(plan)
    setForm({
      nombre:       plan.nombre,
      descripcion:  plan.descripcion || '',
      duracionDias: String(plan.duracionDias),
      precio:       plan.precio,
    })
    setError('')
    setModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const body = {
      nombre:       form.nombre,
      descripcion:  form.descripcion,
      duracionDias: parseInt(form.duracionDias),
      precio:       parseFloat(form.precio),
    }

    try {
      const res = editPlan
        ? await fetch(`/api/planes/${editPlan.id}`, {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(body),
          })
        : await fetch('/api/planes', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(body),
          })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error || 'Error al guardar plan')
        return
      }

      setModal(false)
      await fetchPlanes()

    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(plan: Plan) {
    const accion = plan.activo ? 'desactivar' : 'activar'
    if (!confirm(`¿${accion} el plan "${plan.nombre}"?`)) return

    try {
      await fetch(`/api/planes/${plan.id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ activo: !plan.activo }),
      })
      await fetchPlanes()
    } catch {
      alert('Error al actualizar plan')
    }
  }

  function duracionLabel(dias: number) {
    if (dias === 30)  return 'Mensual'
    if (dias === 90)  return 'Trimestral'
    if (dias === 180) return 'Semestral'
    if (dias === 365) return 'Anual'
    return `${dias} días`
  }

  return (
    <>
      <Header titulo="Planes" subtitulo="Gestión de planes de membresía">
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#185FA5] hover:bg-[#0C447C]
                     text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Nuevo plan
        </button>
      </Header>

      {/* Grid de planes */}
      {loading ? (
        <p className="text-sm text-gray-400">Cargando...</p>
      ) : planes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <p className="text-gray-400 text-sm">No hay planes registrados</p>
          <button onClick={abrirNuevo} className="mt-2 text-sm text-[#185FA5] hover:underline">
            Crear el primer plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {planes.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl border p-5 flex flex-col gap-3 transition-opacity
                ${plan.activo ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{plan.nombre}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{duracionLabel(plan.duracionDias)}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-lg font-medium
                  ${plan.activo
                    ? 'bg-green-50 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                  }`}>
                  {plan.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              {plan.descripcion && (
                <p className="text-xs text-gray-500">{plan.descripcion}</p>
              )}

              <div className="flex items-baseline gap-1 mt-auto">
                <span className="text-2xl font-bold text-gray-900">
                  Bs. {parseFloat(plan.precio).toFixed(2)}
                </span>
                <span className="text-xs text-gray-400">/ {plan.duracionDias} días</span>
              </div>

              <div className="flex gap-2 pt-1 border-t border-gray-100">
                <button
                  onClick={() => abrirEditar(plan)}
                  className="flex-1 py-2 text-xs font-medium text-gray-600 border border-gray-200
                             rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleToggle(plan)}
                  className={`flex-1 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer
                    ${plan.activo
                      ? 'text-amber-600 border border-amber-200 hover:bg-amber-50'
                      : 'text-green-600 border border-green-200 hover:bg-green-50'
                    }`}
                >
                  {plan.activo ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear / editar */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
          onClick={(e) => e.target === e.currentTarget && setModal(false)}
        >
          <div className="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-md">

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">
                {editPlan ? 'Editar plan' : 'Nuevo plan'}
              </h2>
              <button
                onClick={() => setModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Mensual, Trimestral..."
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm
                             text-gray-900 bg-white placeholder:text-gray-400
                             focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                             transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Descripción</label>
                <input
                  type="text"
                  placeholder="Acceso completo por 30 días..."
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm
                             text-gray-900 bg-white placeholder:text-gray-400
                             focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                             transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Duración (días) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="30"
                    value={form.duracionDias}
                    onChange={(e) => setForm({ ...form, duracionDias: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm
                               text-gray-900 bg-white placeholder:text-gray-400
                               focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                               transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Precio (Bs.) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step="0.01"
                    placeholder="150.00"
                    value={form.precio}
                    onChange={(e) => setForm({ ...form, precio: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm
                               text-gray-900 bg-white placeholder:text-gray-400
                               focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                               transition-colors"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                  <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10"/>
                    <path strokeLinecap="round" d="M12 8v4M12 16h.01"/>
                  </svg>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModal(false)}
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
                  {saving ? 'Guardando...' : editPlan ? 'Guardar cambios' : 'Crear plan'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  )
}