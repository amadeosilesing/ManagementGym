interface HeaderProps {
  titulo: string
  subtitulo?: string
  children?: React.ReactNode
}

export default function Header({ titulo, subtitulo, children }: HeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{titulo}</h1>
        {subtitulo && (
          <p className="text-sm text-gray-500 mt-0.5">{subtitulo}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-3">
          {children}
        </div>
      )}
    </div>
  )
}