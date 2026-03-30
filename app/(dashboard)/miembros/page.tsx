'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'

interface Miembro {
  id:        string
  nombre:    string
  apellido:  string
  ci:        string
  telefono:  string | null
  email:     string | null
  activo:    boolean
  creadoEn:  string
}

export default function MiembrosPage() {
  const [miembros, setMiembros] = useState<Miembro[]>([])
  const [search,   setSearch]   = useState('')
  const [loading,  setLoading]  = useState(true)

  async function fetchMiembros(q = '') {
    setLoading(true)
    try {
      const res  = await fetch(`/api/miembros?search=${encodeURIComponent(q)}`)
      const data = await res.json()
      setMiembros(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMiembros()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => fetchMiembros(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  return (
    <>
      <Header titulo="Miembros" subtitulo="Gestión de miembros registrados">
        <Link
          href="/miembros/nuevo"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#185FA5] hover:bg-[#0C447C]
                     text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Nuevo miembro
        </Link>
      </Header>

      {/* Buscador */}
      <div className="relative mb-5 max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input
          type="text"
          placeholder="Buscar por nombre, apellido o CI..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm
                     text-gray-900 bg-white placeholder:text-gray-400
                     focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                     transition-colors"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Miembro</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">CI</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Teléfono</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Estado</th>
              <th className="px-5 py-3.5"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                  Cargando...
                </td>
              </tr>
            ) : miembros.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                  {search ? 'No se encontraron resultados' : 'No hay miembros registrados'}
                </td>
              </tr>
            ) : (
              miembros.map((m) => (
                <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#E6F1FB] flex items-center justify-center
                                      text-xs font-semibold text-[#185FA5] shrink-0">
                        {m.nombre[0]}{m.apellido[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{m.nombre} {m.apellido}</p>
                        <p className="text-xs text-gray-400">{m.email || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{m.ci}</td>
                  <td className="px-5 py-4 text-gray-600">{m.telefono || '—'}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium
                      ${m.activo
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                      }`}>
                      {m.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/miembros/${m.id}`}
                      className="text-sm text-[#185FA5] hover:underline font-medium"
                    >
                      Ver perfil
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}