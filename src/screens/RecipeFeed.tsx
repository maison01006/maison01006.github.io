import { useState, useMemo, useRef } from 'react'
import { Search, Plus, FlaskConical, Heart, Download, Upload, ImageOff } from 'lucide-react'
import type { Recipe, ColorFamily } from '../types'
import { FILTER_TAGS, COLOR_FAMILIES } from '../constants'
import { searchRecipes } from '../lib/search'
import { formatDate, formulaSummary } from '../lib/format'
import { getStorageUsage } from '../storage'
import { exportData, importData } from '../lib/recipes'
import { showToast } from '../components/Toast'
import PhotoThumb from '../components/PhotoThumb'
import Tag from '../components/Tag'

interface Props {
  recipes: Recipe[]
  onSelect: (id: string) => void
  onCreate: () => void
  onToggleFavorite: (id: string) => void
  onDataChange: () => void
}

export default function RecipeFeed({ recipes, onSelect, onCreate, onToggleFavorite, onDataChange }: Props) {
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('전체')
  const [colorFilter, setColorFilter] = useState<ColorFamily | null>(null)
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(
    () => searchRecipes(recipes, query, activeFilter, colorFilter, favoritesOnly),
    [recipes, query, activeFilter, colorFilter, favoritesOnly]
  )

  const before = (r: Recipe) => r.photos.find(p => p.photoType === 'BEFORE')
  const after = (r: Recipe) => r.photos.find(p => p.photoType === 'AFTER')
  const storage = getStorageUsage()

  async function handleExport() {
    try {
      const blob = await exportData()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `color-recipes-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      showToast('데이터를 내보냈습니다')
    } catch {
      showToast('내보내기 중 오류가 발생했습니다')
    }
    setShowMenu(false)
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const mode = window.confirm('기존 데이터와 병합하시겠습니까?\n\n확인 = 병합\n취소 = 덮어쓰기') ? 'merge' : 'overwrite' as const
    try {
      const result = await importData(file, mode)
      showToast(`${result.count}개 레시피를 가져왔습니다`)
      onDataChange()
    } catch {
      showToast('가져오기 중 오류가 발생했습니다')
    }
    e.target.value = ''
    setShowMenu(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex items-start justify-between">
        <div>
          <div className="text-2xl font-bold tracking-tight" style={{ color: '#831843' }}>염색 레시피</div>
          <div className="text-xs mt-0.5" style={{ color: '#9D174D' }}>{recipes.length}개 기록됨 · {storage.label} 사용</div>
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer rounded-full" style={{ color: '#9D174D' }} aria-label="메뉴">
            <Download size={20} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-pink-200 z-30 w-44 overflow-hidden">
              <button onClick={handleExport} className="w-full flex items-center gap-2 px-4 py-3 text-sm cursor-pointer hover:bg-pink-50" style={{ color: '#9D174D' }}>
                <Download size={16} />데이터 내보내기
              </button>
              <button onClick={() => importRef.current?.click()} className="w-full flex items-center gap-2 px-4 py-3 text-sm cursor-pointer hover:bg-pink-50" style={{ color: '#9D174D' }}>
                <Upload size={16} />데이터 가져오기
              </button>
            </div>
          )}
        </div>
      </div>
      <input type="file" accept=".json" ref={importRef} onChange={handleImport} className="hidden" />

      {/* Search */}
      <div className="mx-4 mb-3">
        <div className="flex items-center gap-2.5 rounded-full px-4 py-3" style={{ backgroundColor: '#fff', boxShadow: 'var(--shadow-sm)', border: '1px solid #F9A8D4' }}>
          <Search size={16} className="flex-shrink-0" style={{ color: '#9D174D' }} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="제품, 호수, 색상, 메모 검색..."
            className="flex-1 text-sm outline-none bg-transparent" style={{ color: '#831843' }} aria-label="레시피 검색"
          />
        </div>
      </div>

      {/* Filter chips - treatment tags */}
      <div className="relative mx-4 mb-2">
        <div className="flex gap-2 overflow-x-auto no-scroll pb-0.5" style={{ maskImage: 'linear-gradient(to right, black 90%, transparent)', WebkitMaskImage: 'linear-gradient(to right, black 90%, transparent)' }}>
          {FILTER_TAGS.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className="text-xs font-semibold px-3.5 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 transition-all cursor-pointer"
              style={activeFilter === f
                ? { backgroundColor: '#EC4899', color: '#fff', boxShadow: 'var(--shadow-sm)' }
                : { backgroundColor: '#fff', color: '#9D174D', border: '1px solid #F9A8D4' }
              }
              aria-pressed={activeFilter === f} aria-label={`필터: ${f}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Filter chips - color family + favorites */}
      <div className="flex gap-2 px-4 mb-4 overflow-x-auto no-scroll pb-0.5" style={{ maskImage: 'linear-gradient(to right, black 90%, transparent)', WebkitMaskImage: 'linear-gradient(to right, black 90%, transparent)' }}>
        <button onClick={() => setFavoritesOnly(!favoritesOnly)}
          className="text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 cursor-pointer flex items-center gap-1"
          style={favoritesOnly
            ? { backgroundColor: '#EF4444', color: '#fff' }
            : { backgroundColor: '#fff', color: '#9D174D', border: '1px solid #F9A8D4' }
          }
          aria-pressed={favoritesOnly} aria-label="즐겨찾기만 보기"
        >
          <Heart size={11} fill={favoritesOnly ? '#fff' : 'none'} />즐겨찾기
        </button>
        {COLOR_FAMILIES.map(cf => (
          <button key={cf.value} onClick={() => setColorFilter(colorFilter === cf.value ? null : cf.value)}
            className="text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 cursor-pointer flex items-center gap-1"
            style={colorFilter === cf.value
              ? { backgroundColor: cf.color, color: '#fff' }
              : { backgroundColor: '#fff', color: '#9D174D', border: '1px solid #F9A8D4' }
            }
            aria-pressed={colorFilter === cf.value} aria-label={`색상 계열: ${cf.label}`}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colorFilter === cf.value ? '#fff' : cf.color }} />
            {cf.label}
          </button>
        ))}
      </div>

      {/* Recipe list */}
      <div className="flex-1 overflow-y-auto no-scroll px-4 pb-24 space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24" style={{ color: '#9D174D' }}>
            <FlaskConical size={48} className="mb-3 opacity-40" />
            <div className="text-sm font-medium">레시피가 없습니다</div>
            <div className="text-xs mt-1 opacity-60">아래 + 버튼으로 첫 레시피를 기록하세요</div>
          </div>
        ) : (
          filtered.map(r => (
            <div key={r.id} onClick={() => onSelect(r.id)}
              className="rounded-2xl p-3 flex gap-3 active:scale-[0.98] transition-transform cursor-pointer"
              style={{ backgroundColor: '#fff', boxShadow: 'var(--shadow-md)' }}
            >
              <div className="relative">
                <PhotoThumb before={before(r)} after={after(r)} size={76} />
                {r.photos.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-black/40 text-white flex items-center gap-0.5">
                      <ImageOff size={8} />미등록
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium" style={{ color: '#9D174D' }}>
                    {r.clientName || '—'} · 손상도 Lv.{r.hairState.damageLevel}
                  </div>
                  <button onClick={e => { e.stopPropagation(); onToggleFavorite(r.id) }}
                    className="min-w-[32px] min-h-[32px] flex items-center justify-center cursor-pointer"
                    aria-label={r.isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}
                  >
                    <Heart size={14} fill={r.isFavorite ? '#EF4444' : 'none'} style={{ color: r.isFavorite ? '#EF4444' : '#F9A8D4' }} />
                  </button>
                </div>
                <div className="text-xs mt-0.5" style={{ color: '#9D174D' }}>{formatDate(r.treatmentDate)}</div>
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {r.treatmentTags.map(t => <Tag key={t} variant="type">{t}</Tag>)}
                  {r.colorFamily?.map(cf => {
                    const info = COLOR_FAMILIES.find(c => c.value === cf)
                    return info ? <Tag key={cf} variant="family">{info.label}</Tag> : null
                  })}
                </div>
                <div className="text-xs mt-1.5 leading-relaxed line-clamp-2" style={{ color: '#9D174D' }}>
                  {formulaSummary(r)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <button onClick={onCreate}
        className="fixed bottom-6 right-1/2 translate-x-[170px] w-14 h-14 rounded-full flex items-center justify-center text-white cursor-pointer active:scale-95 transition-transform"
        style={{ backgroundColor: '#8B5CF6', boxShadow: 'var(--shadow-xl)' }}
        aria-label="새 레시피 만들기"
      >
        <Plus size={26} />
      </button>
    </div>
  )
}
