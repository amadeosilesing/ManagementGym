'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { PeriodFilter } from '@/components/ui'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

interface Stats {
  periodo: {
    mes:            number
    anio:           number
    inicioPeriodo:  string
    finPeriodo:     string
  }
  inscripciones: {
    nuevas:         number
    activas:        number
    porVencer:      number
    vencidas:       number
    nuevasAnterior: number
    variacion:      string | null
  }
  miembros: {
    total: number
  }
  ingresos: {
    total:         number
    anterior:      number
    efectivo:      number
    transferencia: number
    tarjeta:       number
    variacion:     string | null
  }
  porVencerDetalle: {
    id:               string
    miembroId:        string
    miembroNombre:    string
    miembroApellido:  string
    miembroCi:        string
    fechaVencimiento: string
    diasRestantes:    number
  }[]
  ingresosPorDia: {
    dia:   string
    total: number
  }[]
  inscripcionesPorDia: {
    dia:   string
    total: number
  }[]
}

export default function DashboardPage() {
  const hoy                         = new Date()
  const [mes,     setMes]           = useState(hoy.getMonth() + 1)
  const [anio,    setAnio]          = useState(hoy.getFullYear())
  const [stats,   setStats]         = useState<Stats | null>(null)
  const [loading, setLoading]       = useState(true)

  const fetchStats = useCallback(async (m: number, a: number) => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/dashboard/stats?mes=${m}&anio=${a}`)
      const data = await res.json()
      setStats(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStats(mes, anio) }, [mes, anio])

  function handlePeriod(m: number, a: number) {
    setMes(m)
    setAnio(a)
  }

  const fmt = (n: number) =>
    `Bs. ${n.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`

  const variacionLabel = (v: string | null, positiveGood = true) => {
    if (!v) return null
    const num      = parseFloat(v)
    const positivo = num >= 0
    const bueno    = positiveGood ? positivo : !positivo
    return (
      <span className={`text-xs font-medium ${bueno ? 'text-green-600' : 'text-red-500'}`}>
        {positivo ? '+' : ''}{v}% vs mes anterior
      </span>
    )
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Cargando...</div>
  )

  if (!stats) return null

  const maxIngreso      = Math.max(...stats.ingresosPorDia.map((d) => d.total), 1)
  const maxInscripcion  = Math.max(...stats.inscripcionesPorDia.map((d) => d.total), 1)
  const esMesActual     = mes === hoy.getMonth() + 1 && anio === hoy.getFullYear()

  return (
    <>
      <Header
        titulo="Dashboard"
        subtitulo={`${MESES[mes - 1]} ${anio}`}
      >
        <PeriodFilter mes={mes} anio={anio} onChange={handlePeriod} />
      </Header>

      {/* Tarjetas principales */}
      <div className="grid grid-cols-4 gap-4 mb-6">

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500">Inscripciones nuevas</p>
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#185FA5" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-600">{stats.inscripciones.nuevas}</p>
          <div className="mt-1">{variacionLabel(stats.inscripciones.variacion)}</div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500">Miembros activos</p>
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#16A34A" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600">{stats.inscripciones.activas}</p>
          <p className="text-xs text-gray-400 mt-1">{stats.miembros.total} registrados en total</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500">Por vencer (7 días)</p>
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#D97706" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-amber-600">{stats.inscripciones.porVencer}</p>
          <p className="text-xs text-gray-400 mt-1">requieren atención</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500">Vencidos</p>
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#EF4444" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-red-500">{stats.inscripciones.vencidas}</p>
          <p className="text-xs text-gray-400 mt-1">sin renovar</p>
        </div>

      </div>

      {/* Fila 2 */}
      <div className="grid grid-cols-3 gap-5 mb-5">

        {/* Ingresos del período */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">Ingresos del período</p>
          <p className="text-2xl font-bold text-gray-900">{fmt(stats.ingresos.total)}</p>
          <div className="mt-0.5 mb-4">{variacionLabel(stats.ingresos.variacion)}</div>

          <div className="flex flex-col gap-2 mb-4">
            {[
              { label: 'Efectivo',      valor: stats.ingresos.efectivo,      color: 'bg-green-400'  },
              { label: 'Transferencia', valor: stats.ingresos.transferencia, color: 'bg-blue-400'   },
              { label: 'Tarjeta',       valor: stats.ingresos.tarjeta,       color: 'bg-purple-400' },
            ].map((m) => (
              <div key={m.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">{m.label}</span>
                  <span className="font-medium text-gray-700">{fmt(m.valor)}</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full">
                  <div
                    className={`h-full ${m.color} rounded-full`}
                    style={{ width: `${stats.ingresos.total > 0 ? Math.min(100, (m.valor / stats.ingresos.total) * 100) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Mini gráfico ingresos por día */}
          {stats.ingresosPorDia.length > 0 && (
            <>
              <p className="text-xs text-gray-400 mb-2">Ingresos por día</p>
              <div className="flex items-end gap-1 h-16">
                {stats.ingresosPorDia.map((d) => (
                  <div key={d.dia} className="flex-1 flex flex-col items-center gap-0.5">
                    <div
                      className="w-full bg-[#185FA5] rounded-t-sm"
                      style={{ height: `${(d.total / maxIngreso) * 100}%`, minHeight: '3px' }}
                      title={`Día ${d.dia}: ${fmt(d.total)}`}
                    />
                    {stats.ingresosPorDia.length <= 10 && (
                      <span className="text-[9px] text-gray-400">{d.dia}</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Inscripciones por día */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">Inscripciones nuevas</p>
          <p className="text-2xl font-bold text-gray-900">{stats.inscripciones.nuevas}</p>
          {stats.inscripciones.nuevasAnterior > 0 && (
            <p className="text-xs text-gray-400 mt-0.5 mb-4">
              Mes anterior: {stats.inscripciones.nuevasAnterior}
            </p>
          )}

          {stats.inscripcionesPorDia.length > 0 ? (
            <>
              <p className="text-xs text-gray-400 mb-2">Inscripciones por día</p>
              <div className="flex items-end gap-1 h-24">
                {stats.inscripcionesPorDia.map((d) => (
                  <div key={d.dia} className="flex-1 flex flex-col items-center gap-0.5">
                    <div
                      className="w-full bg-green-400 rounded-t-sm"
                      style={{ height: `${(d.total / maxInscripcion) * 100}%`, minHeight: '3px' }}
                      title={`Día ${d.dia}: ${d.total} inscripción(es)`}
                    />
                    {stats.inscripcionesPorDia.length <= 10 && (
                      <span className="text-[9px] text-gray-400">{d.dia}</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-24 text-gray-300 text-sm">
              Sin inscripciones en este período
            </div>
          )}
        </div>

        {/* Por vencer esta semana */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-gray-500">
              {esMesActual ? 'Por vencer esta semana' : 'Vencimientos próximos'}
            </p>
            <Link href="/inscripciones" className="text-xs text-[#185FA5] hover:underline">
              Ver todos
            </Link>
          </div>

          {stats.porVencerDetalle.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 text-center">
              <p className="text-sm text-gray-400">Sin vencimientos próximos</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {stats.porVencerDetalle.slice(0, 6).map((m) => (
                <Link
                  key={m.id}
                  href={`/miembros/${m.miembroId}`}
                  className="flex items-center justify-between hover:bg-gray-50
                             rounded-xl px-2 py-1.5 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center
                                    justify-center text-xs font-semibold text-amber-600 shrink-0">
                      {m.miembroNombre[0]}{m.miembroApellido[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 leading-tight">
                        {m.miembroNombre} {m.miembroApellido}
                      </p>
                      <p className="text-xs text-gray-400">CI: {m.miembroCi}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold shrink-0
                    ${m.diasRestantes === 0 ? 'text-red-500' : 'text-amber-600'}`}>
                    {m.diasRestantes === 0 ? 'Hoy' : `${m.diasRestantes}d`}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  )
}