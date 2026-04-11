interface AvatarProps {
  nombre:   string
  apellido: string
  size?:    'sm' | 'md'
}

export default function Avatar({ nombre, apellido, size = 'sm' }: AvatarProps) {
  const dim = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
  return (
    <div className={`${dim} rounded-full bg-[#E6F1FB] flex items-center justify-center
                     font-semibold text-[#185FA5] shrink-0`}>
      {nombre[0]}{apellido[0]}
    </div>
  )
}