type Variant = 'color' | 'type' | 'pre' | 'post'

const styles: Record<Variant, string> = {
  color: 'bg-pink-50 text-pink-600 border border-pink-200',
  type:  'bg-violet-50 text-violet-600 border border-violet-200',
  pre:   'bg-emerald-50 text-emerald-600 border border-emerald-200',
  post:  'bg-amber-50 text-amber-600 border border-amber-200',
}

interface Props {
  children: React.ReactNode
  variant?: Variant
  className?: string
}

export default function Tag({ children, variant = 'color', className = '' }: Props) {
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${styles[variant]} ${className}`}>
      {children}
    </span>
  )
}
