'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'

interface Inscripcion {
  id:               string
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

const estadoConfig: Record<string, { label: string; clase: string }> = {
  activo:     { label: 'Activo',      clase: 'bg-green-50 text-green-700'   },
  por_vencer: { label: 'Por vencer',  clase: 'bg-amber-50 text-amber-700'   },
  vencido:    { label: 'Vencido',     clase: 'bg-red-50 text-red-600'       },
  suspendido: { label: 'Suspendido',  clase: 'bg-gray-100 text-gray-500'    },
  cancelado:  { label: 'Cancelado',   clase: 'bg-gray-100 text-gray-500'    },
}

export default function InscripcionesPage() {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([])
  const [loading,       setLoading]       = useState(true)
  const [filtro,        setFiltro]        = useState('todos')

  async function fetchInscripciones() {
    setLoading(true)
    try {
      const res  = await fetch('/api/inscripciones')
      const data = await res.json()
      setInscripciones(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchInscripciones() }, [])

  const filtradas = filtro === 'todos'
    ? inscripciones
    : inscripciones.filter((i) => i.estadoActual === filtro)

  const conteos = {
    todos:      inscripciones.length,
    activo:     inscripciones.filter((i) => i.estadoActual === 'activo').length,
    por_vencer: inscripciones.filter((i) => i.estadoActual === 'por_vencer').length,
    vencido:    inscripciones.filter((i) => i.estadoActual === 'vencido').length,
  }

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

      {/* Filtros */}
      <div className="flex gap-2 mb-5">
        {[
          { key: 'todos',      label: 'Todos',       count: conteos.todos      },
          { key: 'activo',     label: 'Activos',     count: conteos.activo     },
          { key: 'por_vencer', label: 'Por vencer',  count: conteos.por_vencer },
          { key: 'vencido',    label: 'Vencidos',    count: conteos.vencido    },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-colors cursor-pointer
              ${filtro === f.key
                ? 'bg-[#185FA5] text-white font-medium'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
          >
            {f.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium
              ${filtro === f.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tabla */}
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
                <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                  Cargando...
                </td>
              </tr>
            ) : filtradas.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                  No hay inscripciones registradas
                </td>
              </tr>
            ) : (
              filtradas.map((i) => {
                const estado = estadoConfig[i.estadoActual] ?? estadoConfig.cancelado
                return (
                  <tr key={i.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#E6F1FB] flex items-center justify-center
                                        text-xs font-semibold text-[#185FA5] shrink-0">
                          {i.miembroNombre[0]}{i.miembroApellido[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{i.miembroNombre} {i.miembroApellido}</p>
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
                        ${i.diasRestantes < 0
                          ? 'text-red-500'
                          : i.diasRestantes <= 7
                          ? 'text-amber-600'
                          : 'text-gray-700'
                        }`}>
                        {i.diasRestantes < 0
                          ? `Venció hace ${Math.abs(i.diasRestantes)} días`
                          : `${i.diasRestantes} días`
                        }
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${estado.clase}`}>
                        {estado.label}
                      </span>
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