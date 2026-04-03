'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'

interface Pago {
  id:              string
  monto:           string
  metodo:          string
  referencia:      string | null
  fecha:           string
  inscripcionId:   string
  miembroNombre:   string
  miembroApellido: string
  miembroCi:       string
  planNombre:      string
  registradoPor:   string
  mesAnio:         string
}

const metodoConfig: Record<string, { label: string; clase: string }> = {
  efectivo:      { label: 'Efectivo',      clase: 'bg-green-50 text-green-700'  },
  transferencia: { label: 'Transferencia', clase: 'bg-blue-50 text-blue-700'    },
  tarjeta:       { label: 'Tarjeta',       clase: 'bg-purple-50 text-purple-700' },
  otro:          { label: 'Otro',          clase: 'bg-gray-100 text-gray-500'   },
}

export default function PagosPage() {
  const [pagos,   setPagos]   = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [metodo,  setMetodo]  = useState('todos')

  useEffect(() => {
    fetch('/api/pagos')
      .then((r) => r.json())
      .then((d) => setPagos(d))
      .finally(() => setLoading(false))
  }, [])

  const filtrados = pagos.filter((p) => {
    const matchSearch =
      search === '' ||
      `${p.miembroNombre} ${p.miembroApellido}`.toLowerCase().includes(search.toLowerCase()) ||
      p.miembroCi.includes(search) ||
      p.planNombre.toLowerCase().includes(search.toLowerCase())

    const matchMetodo = metodo === 'todos' || p.metodo === metodo

    return matchSearch && matchMetodo
  })

  const totalFiltrado = filtrados.reduce((acc, p) => acc + parseFloat(p.monto), 0)

  return (
    <>
      <Header titulo="Pagos" subtitulo="Historial de pagos registrados" />

      {/* Resumen */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          {
            label: 'Total registrado',
            valor: `Bs. ${pagos.reduce((a, p) => a + parseFloat(p.monto), 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}`,
            color: 'text-gray-900',
          },
          {
            label: 'Efectivo',
            valor: `Bs. ${pagos.filter((p) => p.metodo === 'efectivo').reduce((a, p) => a + parseFloat(p.monto), 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}`,
            color: 'text-green-600',
          },
          {
            label: 'Transferencia',
            valor: `Bs. ${pagos.filter((p) => p.metodo === 'transferencia').reduce((a, p) => a + parseFloat(p.monto), 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}`,
            color: 'text-blue-600',
          },
          {
            label: 'Tarjeta',
            valor: `Bs. ${pagos.filter((p) => p.metodo === 'tarjeta').reduce((a, p) => a + parseFloat(p.monto), 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}`,
            color: 'text-purple-600',
          },
        ].map((t) => (
          <div key={t.label} className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500 mb-1">{t.label}</p>
            <p className={`text-lg font-bold ${t.color}`}>{t.valor}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar por miembro, CI o plan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm
                       text-gray-900 bg-white placeholder:text-gray-400
                       focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                       transition-colors"
          />
        </div>

        <select
          value={metodo}
          onChange={(e) => setMetodo(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900
                     bg-white focus:outline-none focus:border-blue-500 focus:ring-2
                     focus:ring-blue-100 transition-colors"
        >
          <option value="todos">Todos los métodos</option>
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
          <option value="tarjeta">Tarjeta</option>
          <option value="otro">Otro</option>
        </select>

        {(search || metodo !== 'todos') && (
          <div className="flex items-center px-4 py-2.5 bg-blue-50 border border-blue-200
                          rounded-xl text-sm text-blue-700 font-medium">
            {filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''} —
            Bs. {totalFiltrado.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
          </div>
        )}
      </div>

      {/* Tabla */}
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
                <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                  Cargando...
                </td>
              </tr>
            ) : filtrados.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                  {search || metodo !== 'todos' ? 'No se encontraron resultados' : 'No hay pagos registrados'}
                </td>
              </tr>
            ) : (
              filtrados.map((p) => {
                const metodoInfo = metodoConfig[p.metodo] ?? metodoConfig.otro
                return (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#E6F1FB] flex items-center justify-center
                                        text-xs font-semibold text-[#185FA5] shrink-0">
                          {p.miembroNombre[0]}{p.miembroApellido[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{p.miembroNombre} {p.miembroApellido}</p>
                          <p className="text-xs text-gray-400">CI: {p.miembroCi}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{p.planNombre}</td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">
                        Bs. {parseFloat(p.monto).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                      </p>
                      {p.referencia && (
                        <p className="text-xs text-gray-400">Ref: {p.referencia}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${metodoInfo.clase}`}>
                        {metodoInfo.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-600 text-sm">{p.registradoPor}</td>
                    <td className="px-5 py-4 text-gray-500 text-sm">
                      {new Date(p.fecha).toLocaleDateString('es-BO', {
                        day:   '2-digit',
                        month: 'short',
                        year:  'numeric',
                        hour:  '2-digit',
                        minute:'2-digit',
                      })}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}