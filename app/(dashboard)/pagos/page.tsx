'use client'

import { useEffect, useState, useCallback } from 'react'
import Header from '@/components/layout/Header'
import {
  SearchInput,
  FilterTabs,
  Pagination,
  Badge,
  Avatar,
  PeriodFilter,
} from '@/components/ui'

interface Pago {
  id:              string
  monto:           string
  metodo:          string
  referencia:      string | null
  fecha:           string
  miembroNombre:   string
  miembroApellido: string
  miembroCi:       string
  planNombre:      string
  registradoPor:   string
}

interface Paginacion {
  total:      number
  page:       number
  limit:      number
  totalPages: number
}

interface Conteos {
  todos:         number
  efectivo:      number
  transferencia: number
  tarjeta:       number
}

interface Totales {
  general:       number
  efectivo:      number
  transferencia: number
  tarjeta:       number
}

const metodoConfig: Record<string, { label: string; clase: string }> = {
  efectivo:      { label: 'Efectivo',      clase: 'bg-green-50 text-green-700'   },
  transferencia: { label: 'Transferencia', clase: 'bg-blue-50 text-blue-700'     },
  tarjeta:       { label: 'Tarjeta',       clase: 'bg-purple-50 text-purple-700' },
  otro:          { label: 'Otro',          clase: 'bg-gray-100 text-gray-500'    },
}

const LIMIT = 10

export default function PagosPage() {
  const hoy                                   = new Date()
  const [mes,       setMes]                   = useState(hoy.getMonth() + 1)
  const [anio,      setAnio]                  = useState(hoy.getFullYear())
  const [pagos,     setPagos]                 = useState<Pago[]>([])
  const [paginacion, setPaginacion]           = useState<Paginacion>({ total: 0, page: 1, limit: LIMIT, totalPages: 0 })
  const [conteos,   setConteos]               = useState<Conteos>({ todos: 0, efectivo: 0, transferencia: 0, tarjeta: 0 })
  const [totales,   setTotales]               = useState<Totales>({ general: 0, efectivo: 0, transferencia: 0, tarjeta: 0 })
  const [loading,   setLoading]               = useState(true)
  const [search,    setSearch]                = useState('')
  const [filtro,    setFiltro]                = useState('todos')
  const [page,      setPage]                  = useState(1)

  const fetchPagos = useCallback(async (
    searchVal: string,
    filtroVal: string,
    pageVal:   number,
    mesVal:    number,
    anioVal:   number,
  ) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        search: searchVal,
        metodo: filtroVal,
        page:   String(pageVal),
        limit:  String(LIMIT),
        mes:    String(mesVal),
        anio:   String(anioVal),
      })
      const res  = await fetch(`/api/pagos?${params}`)
      const data = await res.json()
      setPagos(data.data)
      setPaginacion({ total: data.total, page: data.page, limit: data.limit, totalPages: data.totalPages })
      setConteos(data.conteos  ?? { todos: 0, efectivo: 0, transferencia: 0, tarjeta: 0 })
      setTotales(data.totales  ?? { general: 0, efectivo: 0, transferencia: 0, tarjeta: 0 })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchPagos(search, filtro, 1, mes, anio)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    fetchPagos(search, filtro, page, mes, anio)
  }, [filtro, page])

  useEffect(() => {
    setPage(1)
    fetchPagos(search, filtro, 1, mes, anio)
  }, [mes, anio])

  function handleFiltro(f: string) { setFiltro(f); setPage(1) }

  function handlePeriod(m: number, a: number) { setMes(m); setAnio(a) }

  const tabs = [
    { key: 'todos',         label: 'Todos',         count: conteos.todos         },
    { key: 'efectivo',      label: 'Efectivo',      count: conteos.efectivo      },
    { key: 'transferencia', label: 'Transferencia', count: conteos.transferencia },
    { key: 'tarjeta',       label: 'Tarjeta',       count: conteos.tarjeta       },
  ]

  const fmt = (n: number) =>
    `Bs. ${n.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`

  return (
    <>
      <Header titulo="Pagos" subtitulo="Historial de pagos registrados">
        <PeriodFilter mes={mes} anio={anio} onChange={handlePeriod} />
      </Header>

      {/* Resumen del período */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total del período', valor: fmt(totales.general),       color: 'text-gray-900'   },
          { label: 'Efectivo',          valor: fmt(totales.efectivo),      color: 'text-green-600'  },
          { label: 'Transferencia',     valor: fmt(totales.transferencia), color: 'text-blue-600'   },
          { label: 'Tarjeta',           valor: fmt(totales.tarjeta),       color: 'text-purple-600' },
        ].map((t) => (
          <div key={t.label} className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500 mb-1">{t.label}</p>
            <p className={`text-lg font-bold ${t.color}`}>{t.valor}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 mb-5">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por miembro, CI o plan..."
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
              <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Monto</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Método</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Registrado por</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">Cargando...</td>
              </tr>
            ) : pagos.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                  {search || filtro !== 'todos'
                    ? 'No se encontraron resultados'
                    : 'No hay pagos en este período'
                  }
                </td>
              </tr>
            ) : (
              pagos.map((p) => {
                const metodoInfo = metodoConfig[p.metodo] ?? metodoConfig.otro
                return (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar nombre={p.miembroNombre} apellido={p.miembroApellido} />
                        <div>
                          <p className="font-medium text-gray-900">
                            {p.miembroNombre} {p.miembroApellido}
                          </p>
                          <p className="text-xs text-gray-400">CI: {p.miembroCi}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{p.planNombre}</td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">
                        {fmt(parseFloat(p.monto))}
                      </p>
                      {p.referencia && (
                        <p className="text-xs text-gray-400">Ref: {p.referencia}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <Badge label={metodoInfo.label} clase={metodoInfo.clase} />
                    </td>
                    <td className="px-5 py-4 text-gray-600">{p.registradoPor}</td>
                    <td className="px-5 py-4 text-gray-500">
                      {new Date(p.fecha).toLocaleDateString('es-BO', {
                        day:    '2-digit',
                        month:  'short',
                        year:   'numeric',
                        hour:   '2-digit',
                        minute: '2-digit',
                      })}
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