type Variant = 'color' | 'type' | 'pre' | 'post' | 'family'

const styles: Record<Variant, React.CSSProperties> = {
  color: { backgroundColor: '#FDF2F8', color: '#9D174D', border: '1px solid #F9A8D4' },
  type: { backgroundColor: '#EDE9FE', color: '#8B5CF6', border: '1px solid #C4B5FD' },
  pre: { backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' },
  post: { backgroundColor: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' },
  family: { backgroundColor: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB' },
}

interface Props {
  children: React.ReactNode
  variant?: Variant
  className?: string
}

export default function Tag({ children, variant = 'color', className = '' }: Props) {
  return (
    <span
      className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-block ${className}`}
      style={styles[variant]}
    >
      {children}
    </span>
  )
}
