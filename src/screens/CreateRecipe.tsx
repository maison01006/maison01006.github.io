import { useState, useRef } from 'react'
import { X, Camera, Plus, Trash2, Clock, FlaskConical, Layers } from 'lucide-react'
import type { Recipe, Zone, ZoneProduct, HairState, Photo, PhotoType } from '../types'
import { generateId } from '../storage'
import DamageBar from '../components/DamageBar'
import Tag from '../components/Tag'

const BRANDS = ['Wella', 'L\'Oreal', 'Igora', 'Goldwell', 'Davines', 'Pravana']
const TREATMENT_TAGS = ['발레아쥬', '커버그레이', '전체 염색', '탈색 후 염색', '하이라이트', '뿌리 리터치', '옴브레', '에어터치']
const PRE_TAGS  = ['올라플렉스 No.1', '두피보호제', 'PPT', '파이버플렉스', '케라틴 처리']
const POST_TAGS = ['산성 샴푸', '컬러락', '트리트먼트', '올라플렉스 No.2']
const OX_VOLS: Array<10|20|30|40> = [10, 20, 30, 40]
const OX_PCT: Record<number, string> = { 10:'3%', 20:'6%', 30:'9%', 40:'12%' }

function makeDefaultZone(order: number): Zone {
  return {
    id: generateId(),
    zoneName: order === 1 ? '신생부 (뿌리)' : order === 2 ? '모끝 (기시술부)' : `구간 ${order}`,
    applicationOrder: order,
    processingTime: 30,
    products: [
      { id: generateId(), brandName: 'Wella', shadeCode: '', productType: 'CREAM', ratio: 1, isOxidizer: false },
      { id: generateId(), brandName: '산화제', shadeCode: '', productType: 'CREAM', ratio: 1, isOxidizer: true, oxidizerVolume: 20 },
    ],
  }
}

interface Props {
  source?: Recipe
  onSave: (recipe: Recipe) => void
  onCancel: () => void
}

export default function CreateRecipe({ source, onSave, onCancel }: Props) {
  const [mode, setMode] = useState<'quick' | 'detail'>('quick')
  const [clientName, setClientName] = useState(source?.clientName ?? '')
  const [treatmentDate, setTreatmentDate] = useState(source?.treatmentDate ?? new Date().toISOString().slice(0,10))
  const [treatmentTags, setTreatmentTags] = useState<string[]>(source?.treatmentTags ?? [])
  const [heatTreatment, setHeatTreatment] = useState(source?.heatTreatment ?? false)
  const [preTags, setPreTags]   = useState<string[]>(source?.preTreatmentTags ?? [])
  const [postTags, setPostTags] = useState<string[]>(source?.postTreatmentTags ?? [])
  const [memo, setMemo] = useState(source?.memo ?? '')
  const [photos, setPhotos] = useState<Photo[]>(source?.photos ?? [])
  const [hairState, setHairState] = useState<HairState>(source?.hairState ?? { damageLevel: 3 })
  const [zones, setZones] = useState<Zone[]>(source?.zones?.length ? source.zones : [makeDefaultZone(1)])

  const fileRef = useRef<HTMLInputElement>(null)
  const [pendingPhotoType, setPendingPhotoType] = useState<PhotoType>('BEFORE')

  function handlePhotoClick(type: PhotoType) {
    setPendingPhotoType(type)
    fileRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string
      setPhotos(prev => [
        ...prev.filter(p => p.photoType !== pendingPhotoType),
        { id: generateId(), dataUrl, photoType: pendingPhotoType, sortOrder: 0 }
      ])
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function toggleTag<T extends string>(list: T[], item: T, setter: (v: T[]) => void) {
    setter(list.includes(item) ? list.filter(x => x !== item) : [...list, item])
  }

  function addZone() { setZones(prev => [...prev, makeDefaultZone(prev.length + 1)]) }
  function removeZone(id: string) { setZones(prev => prev.filter(z => z.id !== id).map((z, i) => ({ ...z, applicationOrder: i + 1 }))) }
  function updateZone(id: string, patch: Partial<Zone>) { setZones(prev => prev.map(z => z.id === id ? { ...z, ...patch } : z)) }

  function addProduct(zoneId: string) {
    setZones(prev => prev.map(z =>
      z.id === zoneId
        ? { ...z, products: [...z.products, { id: generateId(), brandName: BRANDS[0], shadeCode: '', productType: 'CREAM', ratio: 1, isOxidizer: false }] }
        : z
    ))
  }

  function updateProduct(zoneId: string, productId: string, patch: Partial<ZoneProduct>) {
    setZones(prev => prev.map(z =>
      z.id === zoneId
        ? { ...z, products: z.products.map(p => p.id === productId ? { ...p, ...patch } : p) }
        : z
    ))
  }

  function removeProduct(zoneId: string, productId: string) {
    setZones(prev => prev.map(z =>
      z.id === zoneId ? { ...z, products: z.products.filter(p => p.id !== productId) } : z
    ))
  }

  function handleSave() {
    const now = new Date().toISOString()
    const recipe: Recipe = {
      id: source?.id ?? generateId(),
      clientName: clientName || undefined,
      treatmentDate,
      treatmentTags,
      heatTreatment,
      preTreatmentTags: preTags,
      postTreatmentTags: postTags,
      memo: memo || undefined,
      sourceRecipeId: source?.id,
      hairState,
      zones,
      photos,
      createdAt: source?.createdAt ?? now,
      updatedAt: now,
    }
    onSave(recipe)
  }

  const photoOf = (type: PhotoType) => photos.find(p => p.photoType === type)

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <button onClick={onCancel} className="min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer" style={{ color: '#9D174D' }} aria-label="닫기">
          <X size={22} />
        </button>
        <div className="text-base font-bold" style={{ color: '#831843' }}>{source ? '레시피 수정' : '새 레시피'}</div>
        <button onClick={handleSave} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-sm font-bold px-3 cursor-pointer" style={{ color: '#EC4899' }}>
          저장
        </button>
      </div>

      {/* Mode toggle */}
      <div className="flex mx-4 mb-3 rounded-full p-1 flex-shrink-0" style={{ backgroundColor: '#fff', boxShadow: 'var(--shadow-sm)' }}>
        {(['quick','detail'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="flex-1 py-2.5 text-sm font-semibold rounded-full transition-all duration-200 cursor-pointer"
            style={mode === m
              ? { background: 'linear-gradient(135deg, #EC4899, #8B5CF6)', color: '#fff', boxShadow: 'var(--shadow-sm)' }
              : { color: '#9D174D' }
            }
          >
            {m === 'quick' ? '빠른 기록' : '상세 기록'}
          </button>
        ))}
      </div>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto no-scroll pb-8">
        <input type="file" accept="image/*" ref={fileRef} onChange={handleFileChange} className="hidden" />

        {/* Photos */}
        <FieldLabel icon={<Camera size={13} style={{ color: '#EC4899' }} />} label="사진" required />
        <div className="flex gap-2 px-4 mb-5">
          {(['BEFORE','AFTER','REFERENCE'] as PhotoType[]).map(type => {
            const photo = photoOf(type)
            const labels = { BEFORE: '시술 전', AFTER: '시술 후', REFERENCE: '레퍼런스' }
            return (
              <div
                key={type}
                onClick={() => handlePhotoClick(type)}
                className="flex-1 aspect-square rounded-xl overflow-hidden cursor-pointer flex items-center justify-center flex-col gap-1 relative transition-all duration-200 active:scale-95"
                style={{ border: '2px dashed #F9A8D4' }}
              >
                {photo ? (
                  <img src={photo.dataUrl} alt={labels[type]} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera size={22} style={{ color: '#F9A8D4' }} />
                    <span className="text-xs font-semibold" style={{ color: '#F9A8D4' }}>{labels[type]}</span>
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* Damage level */}
        <FieldLabel icon={<span style={{ color: '#EC4899', fontSize: '10px' }}>●</span>} label="손상도" required />
        <div className="mx-4 mb-5 rounded-xl p-4" style={{ backgroundColor: '#fff', boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex justify-between text-xs mb-3">
            <span className="font-semibold" style={{ color: '#9D174D' }}>모발 손상 단계</span>
            <span style={{ color: '#F9A8D4' }}>1=건강 · 5=극손상</span>
          </div>
          <DamageBar value={hairState.damageLevel} onChange={v => setHairState(s => ({ ...s, damageLevel: v }))} />
        </div>

        {/* Zone section */}
        <FieldLabel icon={<FlaskConical size={13} style={{ color: '#EC4899' }} />} label="구간별 배합" required />
        {zones.map(zone => (
          <ZoneCard
            key={zone.id}
            zone={zone}
            onUpdate={p => updateZone(zone.id, p)}
            onAddProduct={() => addProduct(zone.id)}
            onUpdateProduct={(pid, p) => updateProduct(zone.id, pid, p)}
            onRemoveProduct={pid => removeProduct(zone.id, pid)}
            onRemove={zones.length > 1 ? () => removeZone(zone.id) : undefined}
          />
        ))}

        <button
          onClick={addZone}
          className="flex items-center justify-center gap-2 mx-4 mb-5 py-3.5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 min-h-[48px]"
          style={{ border: '2px dashed #F9A8D4', color: '#EC4899', backgroundColor: 'transparent' }}
        >
          <Plus size={16} />구간 추가
        </button>

        {/* Treatment type */}
        <FieldLabel icon={<span style={{ color: '#EC4899', fontSize: '10px' }}>●</span>} label="시술 유형" />
        <div className="px-4 mb-5">
          <div className="flex flex-wrap gap-2">
            {TREATMENT_TAGS.map(t => (
              <button
                key={t}
                onClick={() => toggleTag(treatmentTags, t, setTreatmentTags)}
                className="text-sm font-semibold px-3.5 py-2 rounded-full cursor-pointer transition-all duration-200 min-h-[40px]"
                style={treatmentTags.includes(t)
                  ? { backgroundColor: '#8B5CF6', color: '#fff' }
                  : { backgroundColor: '#fff', color: '#9D174D', border: '1px solid #F9A8D4' }
                }
              >
                {t}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 mt-3 cursor-pointer min-h-[44px]">
            <input type="checkbox" checked={heatTreatment} onChange={e => setHeatTreatment(e.target.checked)} className="accent-pink-500 w-4 h-4" />
            <span className="text-sm" style={{ color: '#9D174D' }}>열처리</span>
          </label>
          <div className="mt-2">
            <input
              value={treatmentDate}
              onChange={e => setTreatmentDate(e.target.value)}
              type="date"
              className="w-full text-sm rounded-xl px-4 py-3 outline-none min-h-[48px] transition-colors duration-200"
              style={{ color: '#831843', border: '1px solid #F9A8D4', backgroundColor: '#fff' }}
            />
          </div>
        </div>

        {/* Client name */}
        <FieldLabel icon={<span style={{ color: '#EC4899', fontSize: '10px' }}>●</span>} label="고객 이름 (선택)" />
        <div className="px-4 mb-5">
          <input
            value={clientName}
            onChange={e => setClientName(e.target.value)}
            placeholder="직접 입력"
            className="w-full rounded-xl px-4 py-3.5 text-base outline-none min-h-[52px] transition-colors duration-200"
            style={{ backgroundColor: '#fff', boxShadow: 'var(--shadow-sm)', border: '1px solid #F9A8D4', color: '#831843' }}
          />
        </div>

        {/* Memo */}
        <FieldLabel icon={<span style={{ color: '#EC4899', fontSize: '10px' }}>●</span>} label="메모" />
        <div className="px-4 mb-5">
          <textarea
            value={memo}
            onChange={e => setMemo(e.target.value)}
            placeholder="특이사항, 다음 시술 시 주의점..."
            rows={4}
            className="w-full rounded-xl px-4 py-3.5 text-base outline-none resize-none leading-relaxed transition-colors duration-200"
            style={{ backgroundColor: '#fff', boxShadow: 'var(--shadow-sm)', border: '1px solid #F9A8D4', color: '#831843' }}
          />
        </div>

        {/* Detail mode only */}
        {mode === 'detail' && (
          <>
            <FieldLabel icon={<span style={{ color: '#EC4899', fontSize: '10px' }}>●</span>} label="모발 상세" />
            <div className="px-4 mb-5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: '현재 레벨 (1-10)', key: 'currentLevel' },
                  { label: '자연 레벨 (1-10)', key: 'naturalLevel' },
                  { label: '새치 비율 (%)', key: 'grayPercentage' },
                  { label: '탈색 횟수', key: 'bleachCount' },
                ].map(({ label, key }) => (
                  <div key={key} className="rounded-xl px-4 py-3" style={{ backgroundColor: '#fff', boxShadow: 'var(--shadow-sm)', border: '1px solid #F9A8D4' }}>
                    <div className="text-xs mb-1.5" style={{ color: '#9D174D' }}>{label}</div>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={(hairState as unknown as Record<string,unknown>)[key] as number ?? ''}
                      onChange={e => setHairState(s => ({ ...s, [key]: e.target.value ? Number(e.target.value) : undefined }))}
                      className="w-full text-base font-semibold outline-none bg-transparent min-h-[32px]"
                      style={{ color: '#831843' }}
                      placeholder="—"
                    />
                  </div>
                ))}
              </div>
            </div>

            <FieldLabel icon={<Layers size={13} style={{ color: '#EC4899' }} />} label="전·후처리" />
            <div className="mx-4 mb-5 rounded-xl p-4 space-y-4" style={{ backgroundColor: '#fff', boxShadow: 'var(--shadow-sm)', border: '1px solid #F9A8D4' }}>
              <div>
                <div className="text-xs font-semibold mb-2" style={{ color: '#9D174D' }}>전처리 (Pre-treatment)</div>
                <div className="flex flex-wrap gap-2">
                  {PRE_TAGS.map(t => (
                    <button key={t} onClick={() => toggleTag(preTags, t, setPreTags)} className="cursor-pointer min-h-[36px]">
                      <Tag variant={preTags.includes(t) ? 'pre' : 'color'} className={`cursor-pointer ${!preTags.includes(t) ? 'opacity-40' : ''}`}>
                        {t}
                      </Tag>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold mb-2" style={{ color: '#9D174D' }}>후처리 (Post-treatment)</div>
                <div className="flex flex-wrap gap-2">
                  {POST_TAGS.map(t => (
                    <button key={t} onClick={() => toggleTag(postTags, t, setPostTags)} className="cursor-pointer min-h-[36px]">
                      <Tag variant={postTags.includes(t) ? 'post' : 'color'} className={`cursor-pointer ${!postTags.includes(t) ? 'opacity-40' : ''}`}>
                        {t}
                      </Tag>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Save button */}
        <div className="px-4">
          <button
            onClick={handleSave}
            className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-transform duration-200 min-h-[56px]"
            style={{ backgroundColor: '#8B5CF6', boxShadow: 'var(--shadow-lg)' }}
          >
            레시피 저장
          </button>
        </div>
      </div>
    </div>
  )
}

function FieldLabel({ icon, label, required }: { icon: React.ReactNode; label: string; required?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 px-4 mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: '#9D174D' }}>
      {icon}{label}
      {required && <span className="text-[11px] font-semibold normal-case tracking-normal" style={{ color: '#EC4899' }}>필수</span>}
    </div>
  )
}

function ZoneCard({
  zone, onUpdate, onAddProduct, onUpdateProduct, onRemoveProduct, onRemove
}: {
  zone: Zone
  onUpdate: (p: Partial<Zone>) => void
  onAddProduct: () => void
  onUpdateProduct: (id: string, p: Partial<ZoneProduct>) => void
  onRemoveProduct: (id: string) => void
  onRemove?: () => void
}) {
  const orderColors = ['#EC4899', '#F59E0B', '#8B5CF6', '#10B981']
  const color = orderColors[(zone.applicationOrder - 1) % orderColors.length]

  return (
    <div className="mx-4 mb-3 rounded-2xl overflow-hidden" style={{ backgroundColor: '#fff', boxShadow: 'var(--shadow-sm)', border: '1px solid #F9A8D4' }}>
      {/* Zone header */}
      <div className="px-4 py-3 space-y-2" style={{ backgroundColor: '#FDF2F8', borderBottom: '1px solid #F9A8D4' }}>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
          <input
            value={zone.zoneName}
            onChange={e => onUpdate({ zoneName: e.target.value })}
            className="flex-1 text-sm font-bold bg-transparent outline-none min-h-[36px]"
            style={{ color: '#831843' }}
          />
          <span className="text-xs font-black px-2.5 py-1 rounded-full text-white flex-shrink-0" style={{ background: color }}>
            {zone.applicationOrder}차
          </span>
          {onRemove && (
            <button onClick={onRemove} className="min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer transition-colors duration-200" style={{ color: '#F9A8D4' }} aria-label="구간 삭제">
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
            onChange={e => onUpdate({ processingTime: Number(e.target.value) })}
            className="w-16 text-center font-bold text-sm outline-none rounded-lg py-1.5 min-h-[36px]"
            style={{ backgroundColor: '#fff', border: '1px solid #F9A8D4', color: '#831843' }}
          />
          <span className="text-xs" style={{ color: '#9D174D' }}>분</span>
        </div>
      </div>

      {/* Products */}
      <div className="px-4 py-3 space-y-3">
        {zone.products.map(p => (
          <div key={p.id} className="space-y-2">
            {p.isOxidizer ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold flex-shrink-0" style={{ color: '#8B5CF6' }}>산화제</span>
                <select
                  value={p.oxidizerVolume ?? 20}
                  onChange={e => onUpdateProduct(p.id, { oxidizerVolume: Number(e.target.value) as 10|20|30|40 })}
                  className="flex-1 min-w-0 text-sm font-bold rounded-xl px-2 py-3 outline-none cursor-pointer min-h-[48px]"
                  style={{ color: '#8B5CF6', backgroundColor: '#EDE9FE', border: '1px solid #C4B5FD' }}
                >
                  {OX_VOLS.map(v => <option key={v} value={v}>{OX_PCT[v]} ({v}vol)</option>)}
                </select>
                <span className="text-sm flex-shrink-0" style={{ color: '#F9A8D4' }}>×</span>
                <input
                  type="number" inputMode="decimal" step="0.5" min="0.5"
                  value={p.ratio}
                  onChange={e => onUpdateProduct(p.id, { ratio: Number(e.target.value) })}
                  className="w-14 flex-shrink-0 text-center text-sm font-bold rounded-xl py-3 outline-none min-h-[48px]"
                  style={{ color: '#831843', backgroundColor: '#FDF2F8', border: '1px solid #F9A8D4' }}
                />
                <button onClick={() => onRemoveProduct(p.id)} className="min-w-[44px] min-h-[44px] flex-shrink-0 flex items-center justify-center cursor-pointer transition-colors duration-200" style={{ color: '#F9A8D4' }} aria-label="제품 삭제">
                  <Trash2 size={15} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <select
                  value={p.brandName}
                  onChange={e => onUpdateProduct(p.id, { brandName: e.target.value })}
                  className="w-[90px] flex-shrink-0 text-xs font-semibold rounded-xl px-2 py-3 outline-none cursor-pointer min-h-[48px]"
                  style={{ color: '#9D174D', backgroundColor: '#FDF2F8', border: '1px solid #F9A8D4' }}
                >
                  {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <input
                  value={p.shadeCode}
                  onChange={e => onUpdateProduct(p.id, { shadeCode: e.target.value })}
                  placeholder="호수 (예: 7/1)"
                  className="flex-1 min-w-0 text-sm font-bold rounded-xl px-3 py-3 outline-none min-h-[48px]"
                  style={{ color: '#831843', backgroundColor: '#FDF2F8', border: '1px solid #F9A8D4' }}
                />
                <span className="text-sm flex-shrink-0" style={{ color: '#F9A8D4' }}>×</span>
                <input
                  type="number" inputMode="decimal" step="0.5" min="0.5"
                  value={p.ratio}
                  onChange={e => onUpdateProduct(p.id, { ratio: Number(e.target.value) })}
                  className="w-14 flex-shrink-0 text-center text-sm font-bold rounded-xl py-3 outline-none min-h-[48px]"
                  style={{ color: '#831843', backgroundColor: '#FDF2F8', border: '1px solid #F9A8D4' }}
                />
                <button onClick={() => onRemoveProduct(p.id)} className="min-w-[44px] min-h-[44px] flex-shrink-0 flex items-center justify-center cursor-pointer transition-colors duration-200" style={{ color: '#F9A8D4' }} aria-label="제품 삭제">
                  <Trash2 size={15} />
                </button>
              </div>
            )}
          </div>
        ))}

        <button
          onClick={onAddProduct}
          className="flex items-center gap-1.5 text-sm font-semibold py-2 cursor-pointer transition-colors duration-200 min-h-[44px]"
          style={{ color: '#EC4899' }}
        >
          <Plus size={14} />제품 추가
        </button>
      </div>
    </div>
  )
}
