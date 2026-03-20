interface Props {
  icon: React.ReactNode
  label: string
  required?: boolean
}

export default function FieldLabel({ icon, label, required }: Props) {
  return (
    <div className="flex items-center gap-1.5 px-4 mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: '#9D174D' }}>
      {icon}{label}
      {required && <span className="text-xs font-semibold normal-case tracking-normal" style={{ color: '#EC4899' }}>필수</span>}
    </div>
  )
}
