'use client'

interface PeriodFilterProps {
  mes:       number
  anio:      number
  onChange:  (mes: number, anio: number) => void
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export default function PeriodFilter({ mes, anio, onChange }: PeriodFilterProps) {
  const anioActual = new Date().getFullYear()
  const anios      = Array.from({ length: 5 }, (_, i) => anioActual - i)

  const selectClass = `px-3 py-2 border border-gray-300 rounded-xl text-sm text-gray-900
    bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
    transition-colors cursor-pointer`

  return (
    <div className="flex items-center gap-2">
      <select
        value={mes}
        onChange={(e) => onChange(parseInt(e.target.value), anio)}
        className={selectClass}
      >
        {MESES.map((m, i) => (
          <option key={i} value={i + 1}>{m}</option>
        ))}
      </select>
      <select
        value={anio}
        onChange={(e) => onChange(mes, parseInt(e.target.value))}
        className={selectClass}
      >
        {anios.map((a) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>
      <button
        onClick={() => {
          const hoy = new Date()
          onChange(hoy.getMonth() + 1, hoy.getFullYear())
        }}
        className="px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl
                   hover:bg-gray-50 transition-colors cursor-pointer"
      >
        Hoy
      </button>
    </div>
  )
}