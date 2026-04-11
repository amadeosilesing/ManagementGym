interface ErrorAlertProps {
  mensaje: string
}

export default function ErrorAlert({ mensaje }: ErrorAlertProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
      <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10"/>
        <path strokeLinecap="round" d="M12 8v4M12 16h.01"/>
      </svg>
      <p className="text-sm text-red-600">{mensaje}</p>
    </div>
  )
}