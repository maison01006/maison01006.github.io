const LABELS = ['건강', '약손상', '중손상', '강손상', '극손상']
const COLORS = ['#10B981', '#84CC16', '#F59E0B', '#F97316', '#EF4444']

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
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
            style={active
              ? { backgroundColor: COLORS[n-1], color: '#fff', boxShadow: 'var(--shadow-sm)' }
              : { backgroundColor: '#FDF2F8', color: '#9D174D', border: '1px solid #F9A8D4' }
            }
          >
            {n}
            <span className="block text-[9px] font-normal mt-0.5 opacity-80">{LABELS[n-1]}</span>
          </button>
        )
      })}
    </div>
  )
}
