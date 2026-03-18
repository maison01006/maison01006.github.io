import { useState, useMemo } from 'react'
import { Search, Plus, FlaskConical } from 'lucide-react'
import type { Recipe } from '../types'
import PhotoThumb from '../components/PhotoThumb'
import Tag from '../components/Tag'

const FILTERS = ['전체', '발레아쥬', '커버그레이', '전체 염색', '탈색', '하이라이트', '뿌리 리터치']

interface Props {
  recipes: Recipe[]
  onSelect: (id: string) => void
  onCreate: () => void
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return '오늘'
  if (diff === 1) return '어제'
  if (diff < 7) return `${diff}일 전`
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`
}

function formulaSummary(recipe: Recipe): string {
  return recipe.zones.map(z => {
    const colorants = z.products.filter(p => !p.isOxidizer)
    const ox = z.products.find(p => p.isOxidizer)
    const formula = colorants.map(p => `${p.brandName} ${p.shadeCode}`).join('+')
    const oxStr = ox ? ` · ${ox.oxidizerVolume ? `${ox.oxidizerVolume === 10 ? '3' : ox.oxidizerVolume === 20 ? '6' : ox.oxidizerVolume === 30 ? '9' : '12'}%(${ox.oxidizerVolume}vol)` : ''}` : ''
    return `${z.zoneName}: ${formula}${oxStr} ${z.processingTime}분`
  }).join('  /  ')
}

export default function RecipeFeed({ recipes, onSelect, onCreate }: Props) {
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('전체')

  const filtered = useMemo(() => {
    let list = recipes
    if (activeFilter !== '전체') {
      list = list.filter(r => r.treatmentTags.includes(activeFilter))
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(r =>
        (r.clientName || '').toLowerCase().includes(q) ||
        r.treatmentTags.some(t => t.toLowerCase().includes(q)) ||
        (r.memo || '').toLowerCase().includes(q) ||
        r.zones.some(z =>
          z.products.some(p =>
            p.brandName.toLowerCase().includes(q) ||
            p.shadeCode.toLowerCase().includes(q)
          )
        )
      )
    }
    return list
  }, [recipes, query, activeFilter])

  const before = (r: Recipe) => r.photos.find(p => p.photoType === 'BEFORE')
  const after  = (r: Recipe) => r.photos.find(p => p.photoType === 'AFTER')

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        <div className="text-2xl font-bold tracking-tight" style={{ color: '#831843' }}>염색 레시피</div>
        <div className="text-xs mt-0.5" style={{ color: '#9D174D' }}>{recipes.length}개 기록됨</div>
      </div>

      {/* Search */}
      <div className="mx-4 mb-3">
        <div
          className="flex items-center gap-2.5 rounded-full px-4 py-3"
          style={{ backgroundColor: '#fff', boxShadow: 'var(--shadow-sm)', border: '1px solid #F9A8D4' }}
        >
          <Search size={16} className="flex-shrink-0" style={{ color: '#F9A8D4' }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="제품, 호수, 색상, 메모 검색..."
            className="flex-1 text-sm outline-none bg-transparent"
            style={{ color: '#831843' }}
          />
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 px-4 mb-4 overflow-x-auto no-scroll pb-0.5">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className="text-xs font-semibold px-3.5 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 transition-all duration-200 cursor-pointer"
            style={activeFilter === f
              ? { backgroundColor: '#EC4899', color: '#fff', boxShadow: 'var(--shadow-sm)' }
              : { backgroundColor: '#fff', color: '#9D174D', border: '1px solid #F9A8D4' }
            }
          >
            {f}
          </button>
        ))}
      </div>

      {/* Recipe list */}
      <div className="flex-1 overflow-y-auto no-scroll px-4 pb-24 space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24" style={{ color: '#F9A8D4' }}>
            <FlaskConical size={48} className="mb-3 opacity-40" />
            <div className="text-sm font-medium">레시피가 없습니다</div>
            <div className="text-xs mt-1">아래 + 버튼으로 첫 레시피를 기록하세요</div>
          </div>
        ) : (
          filtered.map(r => (
            <div
              key={r.id}
              onClick={() => onSelect(r.id)}
              className="rounded-2xl p-3 flex gap-3 active:scale-[0.98] transition-transform duration-200 cursor-pointer"
              style={{ backgroundColor: '#fff', boxShadow: 'var(--shadow-md)' }}
            >
              <PhotoThumb before={before(r)} after={after(r)} size={76} />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium" style={{ color: '#9D174D' }}>
                  {r.clientName || '—'} · 손상도 Lv.{r.hairState.damageLevel}
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: '#F9A8D4' }}>{formatDate(r.treatmentDate)}</div>
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {r.treatmentTags.map(t => (
                    <Tag key={t} variant="type">{t}</Tag>
                  ))}
                </div>
                <div className="text-[11px] mt-1.5 leading-relaxed line-clamp-2" style={{ color: '#9D174D' }}>
                  {formulaSummary(r)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <button
        onClick={onCreate}
        className="fixed bottom-6 right-5 w-14 h-14 rounded-full flex items-center justify-center text-white cursor-pointer transition-transform duration-200 active:scale-95"
        style={{ backgroundColor: '#8B5CF6', boxShadow: 'var(--shadow-xl)' }}
      >
        <Plus size={26} />
      </button>
    </div>
  )
}
