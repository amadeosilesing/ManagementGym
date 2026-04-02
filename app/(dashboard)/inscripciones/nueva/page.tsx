'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import { Suspense } from 'react'

interface Miembro {
  id:       string
  nombre:   string
  apellido: string
  ci:       string
  activo:   boolean
}

interface Plan {
  id:           string
  nombre:       string
  duracionDias: number
  precio:       string
  activo:       boolean
}

function NuevaInscripcionForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [miembros, setMiembros] = useState<Miembro[]>([])
  const [planes,   setPlanes]   = useState<Plan[]>([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  const [miembroId,   setMiembroId]   = useState(searchParams.get('miembroId') || '')
  const [planId,      setPlanId]      = useState('')
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0])
  const [monto,       setMonto]       = useState('')
  const [metodo,      setMetodo]      = useState('efectivo')
  const [notas,       setNotas]       = useState('')

  // Calcular fecha de vencimiento automáticamente
  const planSeleccionado = planes.find((p) => p.id === planId)
  const fechaVencimiento = planSeleccionado && fechaInicio
    ? (() => {
        const d = new Date(fechaInicio)
        d.setDate(d.getDate() + planSeleccionado.duracionDias)
        return d.toISOString().split('T')[0]
      })()
    : ''

  // Autocompletar monto con precio del plan
  useEffect(() => {
    if (planSeleccionado) {
      setMonto(planSeleccionado.precio)
    }
  }, [planId])

  useEffect(() => {
    async function fetchData() {
      try {
        const [resMiembros, resPlanes] = await Promise.all([
          fetch('/api/miembros'),
          fetch('/api/planes'),
        ])
        const [dataMiembros, dataPlanes] = await Promise.all([
          resMiembros.json(),
          resPlanes.json(),
        ])
        setMiembros(dataMiembros.filter((m: Miembro) => m.activo))
        setPlanes(dataPlanes.filter((p: Plan) => p.activo))
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/inscripciones', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          miembroId,
          planId,
          fechaInicio,
          monto:  parseFloat(monto),
          metodo,
          notas,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error || 'Error al crear inscripción')
        return
      }

      router.push('/inscripciones')
      router.refresh()

    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Cargando...
      </div>
    )
  }

  const inputClass = `w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm
    text-gray-900 bg-white placeholder:text-gray-400
    focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
    transition-colors`

  return (
    <>
      <Header
        titulo="Nueva inscripción"
        subtitulo="Registra la membresía de un miembro"
      >
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-xl
                     hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Cancelar
        </button>
      </Header>

      <div className="max-w-2xl">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Miembro */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Miembro <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={miembroId}
                onChange={(e) => setMiembroId(e.target.value)}
                className={inputClass}
              >
                <option value="">Seleccionar miembro...</option>
                {miembros.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} {m.apellido} — CI: {m.ci}
                  </option>
                ))}
              </select>
            </div>

            {/* Plan */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Plan <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className={inputClass}
              >
                <option value="">Seleccionar plan...</option>
                {planes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} — {p.duracionDias} días — Bs. {parseFloat(p.precio).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Fecha de inicio <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Fecha de vencimiento
                </label>
                <input
                  type="date"
                  readOnly
                  value={fechaVencimiento}
                  className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`}
                  placeholder="Se calcula automáticamente"
                />
              </div>
            </div>

            {/* Pago */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-4">Pago inicial</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Monto (Bs.) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step="0.01"
                    placeholder="150.00"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Método de pago <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={metodo}
                    onChange={(e) => setMetodo(e.target.value)}
                    className={inputClass}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notas */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Notas</label>
              <textarea
                rows={2}
                placeholder="Observaciones sobre la inscripción..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className={`${inputClass} resize-none`}
              />
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
                onClick={() => router.back()}
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
                {saving ? 'Guardando...' : 'Registrar inscripción'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </>
  )
}

export default function NuevaInscripcionPage() {
  return (
    <Suspense>
      <NuevaInscripcionForm />
    </Suspense>
  )
}