'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import {
  SearchInput,
  FilterTabs,
  Pagination,
  Badge,
  Avatar,
} from '@/components/ui'

interface Miembro {
  id:       string
  nombre:   string
  apellido: string
  ci:       string
  telefono: string | null
  email:    string | null
  activo:   boolean
  creadoEn: string
}

interface Paginacion {
  total:      number
  page:       number
  limit:      number
  totalPages: number
}

interface Conteos {
  todos:    number
  activo:   number
  inactivo: number
}

const LIMIT = 10

export default function MiembrosPage() {
  const [miembros,  setMiembros]  = useState<Miembro[]>([])
  const [paginacion, setPaginacion] = useState<Paginacion>({ total: 0, page: 1, limit: LIMIT, totalPages: 0 })
  const [conteos,   setConteos]   = useState<Conteos>({ todos: 0, activo: 0, inactivo: 0 })
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [filtro,    setFiltro]    = useState('todos')
  const [page,      setPage]      = useState(1)

  const fetchMiembros = useCallback(async (
    searchVal: string,
    filtroVal: string,
    pageVal:   number
  ) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        search: searchVal,
        estado: filtroVal,
        page:   String(pageVal),
        limit:  String(LIMIT),
      })
      const res  = await fetch(`/api/miembros?${params}`)
      const data = await res.json()
      setMiembros(data.data)
      setPaginacion({ total: data.total, page: data.page, limit: data.limit, totalPages: data.totalPages })
      setConteos(data.conteos ?? { todos: 0, activo: 0, inactivo: 0 })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); fetchMiembros(search, filtro, 1) }, 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    fetchMiembros(search, filtro, page)
  }, [filtro, page])

  function handleFiltro(f: string) { setFiltro(f); setPage(1) }

  const tabs = [
    { key: 'todos',    label: 'Todos',     count: conteos.todos    },
    { key: 'activo',   label: 'Activos',   count: conteos.activo   },
    { key: 'inactivo', label: 'Inactivos', count: conteos.inactivo },
  ]

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

      <div className="flex flex-col gap-3 mb-5">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre, apellido o CI..."
        />
        <div className="flex items-center gap-3">
          <FilterTabs tabs={tabs} active={filtro} onChange={handleFiltro} />
          {paginacion.total > 0 && (
            <span className="ml-auto text-xs text-gray-400">
              {paginacion.total} resultado{paginacion.total !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

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
                <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">Cargando...</td>
              </tr>
            ) : miembros.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                  {search || filtro !== 'todos' ? 'No se encontraron resultados' : 'No hay miembros registrados'}
                </td>
              </tr>
            ) : (
              miembros.map((m) => (
                <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar nombre={m.nombre} apellido={m.apellido} />
                      <div>
                        <p className="font-medium text-gray-900">{m.nombre} {m.apellido}</p>
                        <p className="text-xs text-gray-400">{m.email || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{m.ci}</td>
                  <td className="px-5 py-4 text-gray-600">{m.telefono || '—'}</td>
                  <td className="px-5 py-4">
                    <Badge
                      label={m.activo ? 'Activo' : 'Inactivo'}
                      clase={m.activo ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}
                    />
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

        <Pagination
          page={page}
          totalPages={paginacion.totalPages}
          total={paginacion.total}
          onChange={setPage}
        />
      </div>
    </>
  )
}