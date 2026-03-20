import { useState, useRef, useMemo } from 'react'
import { Trash2, Plus, Clock, ChevronDown } from 'lucide-react'
import type { Zone, ZoneProduct } from '../types'
import { BRANDS, OX_VOLS, OX_PCT } from '../constants'

interface Props {
  zone: Zone
  recentBrands: string[]
  onUpdate: (p: Partial<Zone>) => void
  onAddProduct: () => void
  onUpdateProduct: (id: string, p: Partial<ZoneProduct>) => void
  onRemoveProduct: (id: string) => void
  onRemove?: () => void
}

const ORDER_COLORS = ['#EC4899', '#F59E0B', '#8B5CF6', '#10B981']

export default function ZoneCard({ zone, recentBrands, onUpdate, onAddProduct, onUpdateProduct, onRemoveProduct, onRemove }: Props) {
  const color = ORDER_COLORS[(zone.applicationOrder - 1) % ORDER_COLORS.length]

  return (
    <div className="mx-4 mb-3 rounded-2xl overflow-hidden" style={{ backgroundColor: '#fff', boxShadow: 'var(--shadow-sm)', border: '1px solid #F9A8D4' }}>
      {/* Zone header */}
      <div className="px-4 py-3 space-y-2" style={{ backgroundColor: '#FDF2F8', borderBottom: '1px solid #F9A8D4' }}>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} aria-hidden="true" />
          <input
            value={zone.zoneName}
            onChange={e => onUpdate({ zoneName: e.target.value })}
            className="flex-1 text-sm font-bold bg-transparent outline-none min-h-[36px]"
            style={{ color: '#831843' }}
            aria-label="구간 이름"
          />
          <span className="text-xs font-black px-2.5 py-1 rounded-full text-white flex-shrink-0" style={{ background: color }}>
            {zone.applicationOrder}차
          </span>
          {onRemove && (
            <button onClick={onRemove} className="min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer" style={{ color: '#F9A8D4' }} aria-label="구간 삭제">
              <Trash2 size={15} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Clock size={13} style={{ color: '#9D174D' }} />
          <span className="text-xs" style={{ color: '#9D174D' }}>방치 시간</span>
          <input
            type="number"
            inputMode="numeric"
            value={zone.processingTime}
            onChange={e => onUpdate({ processingTime: Math.max(1, Number(e.target.value) || 1) })}
            className="w-16 text-center font-bold text-sm outline-none rounded-lg py-1.5 min-h-[36px]"
            style={{ backgroundColor: '#fff', border: '1px solid #F9A8D4', color: '#831843' }}
            aria-label="방치 시간 (분)"
          />
          <span className="text-xs" style={{ color: '#9D174D' }}>분</span>
        </div>
      </div>

      {/* Products */}
      <div className="px-4 py-3 space-y-3">
        {zone.products.map(p => (
          <ProductRow
            key={p.id}
            product={p}
            recentBrands={recentBrands}
            onUpdate={patch => onUpdateProduct(p.id, patch)}
            onRemove={() => onRemoveProduct(p.id)}
          />
        ))}
        <button
          onClick={onAddProduct}
          className="flex items-center gap-1.5 text-sm font-semibold py-2 cursor-pointer min-h-[44px]"
          style={{ color: '#EC4899' }}
          aria-label="제품 추가"
        >
          <Plus size={14} />제품 추가
        </button>
      </div>
    </div>
  )
}

function ProductRow({ product: p, recentBrands, onUpdate, onRemove }: {
  product: ZoneProduct
  recentBrands: string[]
  onUpdate: (patch: Partial<ZoneProduct>) => void
  onRemove: () => void
}) {
  const [brandOpen, setBrandOpen] = useState(false)
  const [brandInput, setBrandInput] = useState(p.brandName)
  const inputRef = useRef<HTMLInputElement>(null)

  const allBrands = useMemo(() => {
    const set = new Set([...recentBrands, ...BRANDS])
    return [...set]
  }, [recentBrands])

  const filtered = useMemo(() => {
    if (!brandInput.trim()) return allBrands
    const q = brandInput.toLowerCase()
    return allBrands.filter(b => b.toLowerCase().includes(q))
  }, [brandInput, allBrands])

  if (p.isOxidizer) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold flex-shrink-0" style={{ color: '#8B5CF6' }}>산화제</span>
          <select
            value={p.oxidizerVolume ?? 20}
            onChange={e => onUpdate({ oxidizerVolume: Number(e.target.value) as 10 | 20 | 30 | 40 })}
            className="flex-1 min-w-0 text-sm font-bold rounded-xl px-2 py-3 outline-none cursor-pointer min-h-[48px]"
            style={{ color: '#8B5CF6', backgroundColor: '#EDE9FE', border: '1px solid #C4B5FD' }}
            aria-label="산화제 볼륨"
          >
            {OX_VOLS.map(v => <option key={v} value={v}>{OX_PCT[v]} ({v}vol)</option>)}
          </select>
          <span className="text-sm flex-shrink-0" style={{ color: '#9D174D' }}>×</span>
          <input
            type="number" inputMode="decimal" step="0.5" min="0.5"
            value={p.ratio}
            onChange={e => onUpdate({ ratio: Math.max(0.5, Number(e.target.value) || 0.5) })}
            className="w-14 flex-shrink-0 text-center text-sm font-bold rounded-xl py-3 outline-none min-h-[48px]"
            style={{ color: '#831843', backgroundColor: '#FDF2F8', border: '1px solid #F9A8D4' }}
            aria-label="산화제 비율"
          />
          <button onClick={onRemove} className="min-w-[44px] min-h-[44px] flex-shrink-0 flex items-center justify-center cursor-pointer" style={{ color: '#F9A8D4' }} aria-label="제품 삭제">
            <Trash2 size={15} />
          </button>
        </div>
        <div className="flex items-center gap-1.5 pl-10">
          <span className="text-xs" style={{ color: '#9D174D' }}>g</span>
          <input
            type="number" inputMode="decimal" step="1" min="0"
            value={p.amountGram ?? ''}
            onChange={e => onUpdate({ amountGram: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="그램"
            className="w-20 text-center text-sm rounded-lg py-1.5 outline-none"
            style={{ color: '#831843', backgroundColor: '#FDF2F8', border: '1px solid #F9A8D4' }}
            aria-label="산화제 그램 수"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        {/* Brand combobox */}
        <div className="relative w-[90px] flex-shrink-0">
          <input
            ref={inputRef}
            value={brandInput}
            onChange={e => { setBrandInput(e.target.value); setBrandOpen(true) }}
            onFocus={() => setBrandOpen(true)}
            onBlur={() => setTimeout(() => {
              setBrandOpen(false)
              if (brandInput.trim()) onUpdate({ brandName: brandInput.trim() })
              else { setBrandInput(p.brandName) }
            }, 150)}
            className="w-full text-xs font-semibold rounded-xl px-2 py-3 outline-none min-h-[48px] pr-6"
            style={{ color: '#9D174D', backgroundColor: '#FDF2F8', border: '1px solid #F9A8D4' }}
            aria-label="브랜드"
            placeholder="브랜드"
          />
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#F9A8D4' }} />
          {brandOpen && filtered.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-pink-200 z-20 max-h-40 overflow-y-auto">
              {filtered.map(b => (
                <button
                  key={b}
                  onMouseDown={() => { setBrandInput(b); onUpdate({ brandName: b }); setBrandOpen(false) }}
                  className="w-full text-left text-xs px-3 py-2.5 hover:bg-pink-50 cursor-pointer"
                  style={{ color: '#9D174D' }}
                >
                  {b}
                </button>
              ))}
            </div>
          )}
        </div>
        <input
          value={p.shadeCode}
          onChange={e => onUpdate({ shadeCode: e.target.value })}
          placeholder="호수"
          className="flex-1 min-w-0 text-sm font-bold rounded-xl px-3 py-3 outline-none min-h-[48px]"
          style={{ color: '#831843', backgroundColor: '#FDF2F8', border: '1px solid #F9A8D4' }}
          aria-label="호수 코드"
        />
        <span className="text-sm flex-shrink-0" style={{ color: '#9D174D' }}>×</span>
        <input
          type="number" inputMode="decimal" step="0.5" min="0.5"
          value={p.ratio}
          onChange={e => onUpdate({ ratio: Math.max(0.5, Number(e.target.value) || 0.5) })}
          className="w-14 flex-shrink-0 text-center text-sm font-bold rounded-xl py-3 outline-none min-h-[48px]"
          style={{ color: '#831843', backgroundColor: '#FDF2F8', border: '1px solid #F9A8D4' }}
          aria-label="비율"
        />
        <button onClick={onRemove} className="min-w-[44px] min-h-[44px] flex-shrink-0 flex items-center justify-center cursor-pointer" style={{ color: '#F9A8D4' }} aria-label="제품 삭제">
          <Trash2 size={15} />
        </button>
      </div>
      <div className="flex items-center gap-1.5 pl-[96px]">
        <span className="text-xs" style={{ color: '#9D174D' }}>g</span>
        <input
          type="number" inputMode="decimal" step="1" min="0"
          value={p.amountGram ?? ''}
          onChange={e => onUpdate({ amountGram: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="그램"
          className="w-20 text-center text-sm rounded-lg py-1.5 outline-none"
          style={{ color: '#831843', backgroundColor: '#FDF2F8', border: '1px solid #F9A8D4' }}
          aria-label="그램 수"
        />
      </div>
    </div>
  )
}
