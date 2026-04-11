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

interface Inscripcion {
  id:               string
  miembroId:        string
  miembroNombre:    string
  miembroApellido:  string
  miembroCi:        string
  planNombre:       string
  planPrecio:       string
  fechaInicio:      string
  fechaVencimiento: string
  estadoActual:     string
  diasRestantes:    number
}

interface Paginacion {
  total:      number
  page:       number
  limit:      number
  totalPages: number
}

interface Conteos {
  todos:      number
  activo:     number
  por_vencer: number
  vencido:    number
}

const estadoConfig: Record<string, { label: string; clase: string }> = {
  activo:     { label: 'Activo',     clase: 'bg-green-50 text-green-700'  },
  por_vencer: { label: 'Por vencer', clase: 'bg-amber-50 text-amber-700'  },
  vencido:    { label: 'Vencido',    clase: 'bg-red-50 text-red-600'      },
  suspendido: { label: 'Suspendido', clase: 'bg-gray-100 text-gray-500'   },
  cancelado:  { label: 'Cancelado',  clase: 'bg-gray-100 text-gray-500'   },
}

const LIMIT = 10

export default function InscripcionesPage() {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([])
  const [paginacion,    setPaginacion]    = useState<Paginacion>({ total: 0, page: 1, limit: LIMIT, totalPages: 0 })
  const [conteos,       setConteos]       = useState<Conteos>({ todos: 0, activo: 0, por_vencer: 0, vencido: 0 })
  const [loading,       setLoading]       = useState(true)
  const [search,        setSearch]        = useState('')
  const [filtro,        setFiltro]        = useState('todos')
  const [page,          setPage]          = useState(1)

  const fetchInscripciones = useCallback(async (
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
      const res  = await fetch(`/api/inscripciones?${params}`)
      const data = await res.json()
      setInscripciones(data.data)
      setPaginacion({ total: data.total, page: data.page, limit: data.limit, totalPages: data.totalPages })
      setConteos(data.conteos ?? { todos: 0, activo: 0, por_vencer: 0, vencido: 0 })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); fetchInscripciones(search, filtro, 1) }, 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    fetchInscripciones(search, filtro, page)
  }, [filtro, page])

  function handleFiltro(f: string) { setFiltro(f); setPage(1) }

  const tabs = [
    { key: 'todos',      label: 'Todos',      count: conteos.todos      },
    { key: 'activo',     label: 'Activos',    count: conteos.activo     },
    { key: 'por_vencer', label: 'Por vencer', count: conteos.por_vencer },
    { key: 'vencido',    label: 'Vencidos',   count: conteos.vencido    },
  ]

  return (
    <>
      <Header titulo="Inscripciones" subtitulo="Historial de membresías registradas">
        <Link
          href="/inscripciones/nueva"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#185FA5] hover:bg-[#0C447C]
                     text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Nueva inscripción
        </Link>
      </Header>

      <div className="flex flex-col gap-3 mb-5">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre, CI o plan..."
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
              <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Plan</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Inicio</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Vencimiento</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Días</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">Cargando...</td>
              </tr>
            ) : inscripciones.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                  {search || filtro !== 'todos' ? 'No se encontraron resultados' : 'No hay inscripciones registradas'}
                </td>
              </tr>
            ) : (
              inscripciones.map((i) => {
                const estado = estadoConfig[i.estadoActual] ?? estadoConfig.cancelado
                return (
                  <tr key={i.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar nombre={i.miembroNombre} apellido={i.miembroApellido} />
                        <div>
                          <Link
                            href={`/miembros/${i.miembroId}`}
                            className="font-medium text-gray-900 hover:text-[#185FA5] transition-colors"
                          >
                            {i.miembroNombre} {i.miembroApellido}
                          </Link>
                          <p className="text-xs text-gray-400">CI: {i.miembroCi}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-gray-900">{i.planNombre}</p>
                      <p className="text-xs text-gray-400">Bs. {parseFloat(i.planPrecio).toFixed(2)}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {new Date(i.fechaInicio).toLocaleDateString('es-BO')}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {new Date(i.fechaVencimiento).toLocaleDateString('es-BO')}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-sm font-medium
                        ${i.diasRestantes < 0 ? 'text-red-500' : i.diasRestantes <= 7 ? 'text-amber-600' : 'text-gray-700'}`}>
                        {i.diasRestantes < 0
                          ? `Venció hace ${Math.abs(i.diasRestantes)}d`
                          : `${i.diasRestantes} días`}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge label={estado.label} clase={estado.clase} />
                    </td>
                  </tr>
                )
              })
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