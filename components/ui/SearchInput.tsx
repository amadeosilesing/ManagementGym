interface SearchInputProps {
  value:       string
  onChange:    (value: string) => void
  placeholder?: string
}

export default function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  return (
    <div className="relative max-w-sm">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Buscar...'}
        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm
                   text-gray-900 bg-white placeholder:text-gray-400
                   focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                   transition-colors"
      />
    </div>
  )
}