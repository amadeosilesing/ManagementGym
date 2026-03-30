import Header from '@/components/layout/Header'

export default function DashboardPage() {
  return (
    <>
      <Header
        titulo="Dashboard"
        subtitulo="Resumen general del gimnasio"
      />

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Miembros activos',    valor: '—', color: 'text-blue-600' },
          { label: 'Por vencer (7 días)', valor: '—', color: 'text-amber-600' },
          { label: 'Vencidos',            valor: '—', color: 'text-red-500'  },
          { label: 'Nuevos este mes',     valor: '—', color: 'text-green-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
            <p className={`text-2xl font-semibold ${stat.color}`}>{stat.valor}</p>
          </div>
        ))}
      </div>
    </>
  )
}