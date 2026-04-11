interface BadgeProps {
  label:  string
  clase:  string
}

export default function Badge({ label, clase }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${clase}`}>
      {label}
    </span>
  )
}