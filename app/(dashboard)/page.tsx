'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'

interface Stats {
  inscripciones: {
    totalActivos:  number
    porVencer:     number
    vencidos:      number
    nuevosEsteMes: number
  }
  miembros: {
    total: number
  }
  ingresos: {
    esteMes:     number
    mesAnterior: number
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
  ingresosPorMes: {
    mes:   string
    total: number
  }[]
}

export default function DashboardPage() {
  const [stats,   setStats]   = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((r) => r.json())
      .then((d) => setStats(d))
      .finally(() => setLoading(false))
  }, [])

  const variacionIngresos = stats
    ? stats.ingresos.mesAnterior > 0
      ? (((stats.ingresos.esteMes - stats.ingresos.mesAnterior) / stats.ingresos.mesAnterior) * 100).toFixed(1)
      : null
    : null

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Cargando...
      </div>
    )
  }

  if (!stats) return null

  const tarjetas = [
    {
      label:  'Miembros activos',
      valor:  stats.inscripciones.totalActivos,
      color:  'text-blue-600',
      bg:     'bg-blue-50',
      icono: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#185FA5" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
      ),
    },
    {
      label:  'Por vencer (7 días)',
      valor:  stats.inscripciones.porVencer,
      color:  'text-amber-600',
      bg:     'bg-amber-50',
      icono: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#D97706" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      ),
    },
    {
      label:  'Vencidos',
      valor:  stats.inscripciones.vencidos,
      color:  'text-red-500',
      bg:     'bg-red-50',
      icono: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#EF4444" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
      ),
    },
    {
      label:  'Nuevos este mes',
      valor:  stats.inscripciones.nuevosEsteMes,
      color:  'text-green-600',
      bg:     'bg-green-50',
      icono: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#16A34A" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
        </svg>
      ),
    },
  ]

  const maxIngreso = Math.max(...stats.ingresosPorMes.map((m) => m.total), 1)

  return (
    <>
      <Header
        titulo="Dashboard"
        subtitulo={`Resumen general — ${new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })}`}
      />

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {tarjetas.map((t) => (
          <div key={t.label} className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500">{t.label}</p>
              <div className={`w-8 h-8 ${t.bg} rounded-lg flex items-center justify-center`}>
                {t.icono}
              </div>
            </div>
            <p className={`text-3xl font-bold ${t.color}`}>{t.valor}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">

        {/* Ingresos del mes */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">Ingresos este mes</p>
          <p className="text-2xl font-bold text-gray-900">
            Bs. {stats.ingresos.esteMes.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
          </p>
          {variacionIngresos !== null && (
            <p className={`text-xs mt-1 font-medium
              ${Number(variacionIngresos) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {Number(variacionIngresos) >= 0 ? '+' : ''}{variacionIngresos}% vs mes anterior
            </p>
          )}
          <p className="text-xs text-gray-400 mt-0.5">
            Mes anterior: Bs. {stats.ingresos.mesAnterior.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
          </p>

          {/* Gráfico de barras simple */}
          {stats.ingresosPorMes.length > 0 && (
            <div className="mt-5">
              <p className="text-xs text-gray-400 mb-3">Últimos 6 meses</p>
              <div className="flex items-end gap-2 h-20">
                {stats.ingresosPorMes.map((m) => (
                  <div key={m.mes} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-[#185FA5] rounded-t-md transition-all"
                      style={{ height: `${(m.total / maxIngreso) * 100}%`, minHeight: '4px' }}
                    />
                    <span className="text-[10px] text-gray-400 truncate w-full text-center">
                      {m.mes.split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Total miembros */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">Total de miembros</p>
          <p className="text-2xl font-bold text-gray-900">{stats.miembros.total}</p>
          <p className="text-xs text-gray-400 mt-0.5">registrados en el sistema</p>

          <div className="mt-5 flex flex-col gap-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Activos</span>
                <span className="font-medium text-gray-700">{stats.inscripciones.totalActivos}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${stats.miembros.total > 0 ? (stats.inscripciones.totalActivos / stats.miembros.total) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Vencidos</span>
                <span className="font-medium text-gray-700">{stats.inscripciones.vencidos}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full">
                <div
                  className="h-full bg-red-400 rounded-full"
                  style={{ width: `${stats.miembros.total > 0 ? (stats.inscripciones.vencidos / stats.miembros.total) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Por vencer</span>
                <span className="font-medium text-gray-700">{stats.inscripciones.porVencer}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${stats.miembros.total > 0 ? (stats.inscripciones.porVencer / stats.miembros.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Por vencer — alertas */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-gray-500">Por vencer esta semana</p>
            <Link
              href="/inscripciones?filtro=por_vencer"
              className="text-xs text-[#185FA5] hover:underline"
            >
              Ver todos
            </Link>
          </div>

          {stats.porVencerDetalle.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 text-center">
              <p className="text-sm text-gray-400">Sin vencimientos próximos</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {stats.porVencerDetalle.slice(0, 5).map((m) => (
                <Link
                  key={m.id}
                  href={`/miembros/${m.miembroId}`}
                  className="flex items-center justify-between hover:bg-gray-50 rounded-xl px-2 py-1.5 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center
                                    text-xs font-semibold text-amber-600 shrink-0">
                      {m.miembroNombre[0]}{m.miembroApellido[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
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