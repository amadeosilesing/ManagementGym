'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'

export default function NuevoMiembroPage() {
  const router = useRouter()
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const form = e.currentTarget
    const data = {
      nombre:          (form.elements.namedItem('nombre')          as HTMLInputElement).value,
      apellido:        (form.elements.namedItem('apellido')        as HTMLInputElement).value,
      ci:              (form.elements.namedItem('ci')              as HTMLInputElement).value,
      telefono:        (form.elements.namedItem('telefono')        as HTMLInputElement).value,
      email:           (form.elements.namedItem('email')           as HTMLInputElement).value,
      fechaNacimiento: (form.elements.namedItem('fechaNacimiento') as HTMLInputElement).value,
      genero:          (form.elements.namedItem('genero')          as HTMLSelectElement).value,
      notas:           (form.elements.namedItem('notas')           as HTMLTextAreaElement).value,
    }

    try {
      const res = await fetch('/api/miembros', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error || 'Error al crear miembro')
        return
      }

      router.push('/miembros')
      router.refresh()

    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header
        titulo="Nuevo miembro"
        subtitulo="Completa los datos para registrar un miembro"
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

            {/* Nombre y Apellido */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  name="nombre"
                  type="text"
                  required
                  placeholder="Juan"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm
                             text-gray-900 bg-white placeholder:text-gray-400
                             focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                             transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Apellido <span className="text-red-500">*</span>
                </label>
                <input
                  name="apellido"
                  type="text"
                  required
                  placeholder="Pérez"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm
                             text-gray-900 bg-white placeholder:text-gray-400
                             focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                             transition-colors"
                />
              </div>
            </div>

            {/* CI y Teléfono */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  CI <span className="text-red-500">*</span>
                </label>
                <input
                  name="ci"
                  type="text"
                  required
                  placeholder="12345678"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm
                             text-gray-900 bg-white placeholder:text-gray-400
                             focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                             transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Teléfono
                </label>
                <input
                  name="telefono"
                  type="tel"
                  placeholder="70012345"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm
                             text-gray-900 bg-white placeholder:text-gray-400
                             focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                             transition-colors"
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                name="email"
                type="email"
                placeholder="juan@email.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm
                           text-gray-900 bg-white placeholder:text-gray-400
                           focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                           transition-colors"
              />
            </div>

            {/* Fecha de nacimiento y Género */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Fecha de nacimiento
                </label>
                <input
                  name="fechaNacimiento"
                  type="date"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm
                             text-gray-900 bg-white
                             focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                             transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Género
                </label>
                <select
                  name="genero"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm
                             text-gray-900 bg-white
                             focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                             transition-colors"
                >
                  <option value="">Sin especificar</option>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            </div>

            {/* Notas */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Notas internas
              </label>
              <textarea
                name="notas"
                rows={3}
                placeholder="Lesiones, preferencias, observaciones..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm
                           text-gray-900 bg-white placeholder:text-gray-400
                           focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                           transition-colors resize-none"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10"/>
                  <path strokeLinecap="round" d="M12 8v4M12 16h.01"/>
                </svg>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Botones */}
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
                disabled={loading}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[#185FA5]
                           hover:bg-[#0C447C] disabled:bg-blue-300 rounded-xl
                           transition-colors cursor-pointer"
              >
                {loading ? 'Guardando...' : 'Registrar miembro'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </>
  )
}