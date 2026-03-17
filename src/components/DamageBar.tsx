const LABELS = ['건강', '약손상', '중손상', '강손상', '극손상']
const COLORS = [
  'bg-emerald-500',
  'bg-lime-500',
  'bg-amber-500',
  'bg-orange-500',
  'bg-red-500',
]

interface Props {
  value: 1 | 2 | 3 | 4 | 5
  onChange?: (v: 1 | 2 | 3 | 4 | 5) => void
  readOnly?: boolean
}

export default function DamageBar({ value, onChange, readOnly }: Props) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map(n => {
        const active = n === value
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(n as 1|2|3|4|5)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer
              ${active
                ? `${COLORS[n-1]} text-white shadow-sm`
                : 'bg-pink-50 text-gray-400 border border-pink-100'
              }
              ${readOnly ? 'cursor-default' : ''}`}
          >
            {n}
            <span className="block text-[9px] font-normal mt-0.5 opacity-80">{LABELS[n-1]}</span>
          </button>
        )
      })}
    </div>
  )
}
