interface ModalProps {
  titulo:   string
  onClose:  () => void
  children: React.ReactNode
  size?:    'sm' | 'md'
}

export default function Modal({ titulo, onClose, children, size = 'md' }: ModalProps) {
  const maxW = size === 'sm' ? 'max-w-sm' : 'max-w-md'

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`bg-white rounded-2xl border border-gray-200 p-6 w-full ${maxW}`}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">{titulo}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}