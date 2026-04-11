interface InputFieldProps {
  label:        string
  required?:    boolean
  error?:       string
  children:     React.ReactNode
}

export default function InputField({ label, required, error, children }: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}