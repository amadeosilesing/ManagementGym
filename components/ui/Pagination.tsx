interface PaginationProps {
  page:       number
  totalPages: number
  total:      number
  onChange:   (page: number) => void
}

export default function Pagination({ page, totalPages, total, onChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce<(number | string)[]>((acc, p, idx, arr) => {
      if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...')
      acc.push(p)
      return acc
    }, [])

  return (
    <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
      <p className="text-xs text-gray-400">
        Página {page} de {totalPages} — {total} resultados
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg
                     hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors cursor-pointer"
        >
          Anterior
        </button>

        {pages.map((p, idx) =>
          p === '...' ? (
            <span key={`dots-${idx}`} className="px-2 text-gray-400 text-sm">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p as number)}
              className={`w-8 h-8 text-sm rounded-lg transition-colors cursor-pointer
                ${page === p
                  ? 'bg-[#185FA5] text-white font-medium'
                  : 'text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg
                     hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors cursor-pointer"
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}