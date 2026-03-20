import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Camera, Plus, FlaskConical, Layers, Loader2, Palette, Heart } from 'lucide-react'
import type { Recipe, Zone, ZoneProduct, HairState, Photo, PhotoType, ColorFamily } from '../types'
import { CURRENT_SCHEMA_VERSION } from '../types'
import { generateId, saveDraft, loadDraft, clearDraft } from '../storage'
import { compressImage, createThumbnail, savePhoto, getPhotoUrl } from '../photoStorage'
import { TREATMENT_TAGS, PRE_TAGS, POST_TAGS, COLOR_FAMILIES } from '../constants'
import { validateRecipe } from '../lib/validation'
import { getRecentBrands, getRecentTags } from '../lib/search'
import { showToast } from '../components/Toast'
import DamageBar from '../components/DamageBar'
import FieldLabel from '../components/FieldLabel'
import Tag from '../components/Tag'
import ZoneCard from '../components/ZoneCard'

function makeDefaultZone(order: number): Zone {
  return {
    id: generateId(), zoneName: order === 1 ? '신생부 (뿌리)' : order === 2 ? '모끝 (기시술부)' : `구간 ${order}`,
    applicationOrder: order, processingTime: 30,
    products: [
      { id: generateId(), brandName: 'Wella', shadeCode: '', productType: 'CREAM', ratio: 1, isOxidizer: false },
      { id: generateId(), brandName: '산화제', shadeCode: '', productType: 'CREAM', ratio: 1, isOxidizer: true, oxidizerVolume: 20 },
    ],
  }
}

interface Props {
  source?: Recipe
  isEdit?: boolean
  allRecipes: Recipe[]
  onSave: (recipe: Recipe) => void
  onCancel: () => void
}

export default function CreateRecipe({ source, isEdit, allRecipes, onSave, onCancel }: Props) {
  const [mode, setMode] = useState<'quick' | 'detail'>('quick')
  const [clientName, setClientName] = useState(source?.clientName ?? '')
  const [treatmentDate, setTreatmentDate] = useState(source?.treatmentDate ?? new Date().toISOString().slice(0, 10))
  const [treatmentTags, setTreatmentTags] = useState<string[]>(source?.treatmentTags ?? [])
  const [customTag, setCustomTag] = useState('')
  const [heatTreatment, setHeatTreatment] = useState(source?.heatTreatment ?? false)
  const [preTags, setPreTags] = useState<string[]>(source?.preTreatmentTags ?? [])
  const [postTags, setPostTags] = useState<string[]>(source?.postTreatmentTags ?? [])
  const [memo, setMemo] = useState(source?.memo ?? '')
  const [photos, setPhotos] = useState<Photo[]>(source?.photos ?? [])
  const [hairState, setHairState] = useState<HairState>(source?.hairState ?? { damageLevel: 3 })
  const [zones, setZones] = useState<Zone[]>(source?.zones?.length ? source.zones : [makeDefaultZone(1)])
  const [colorFamily, setColorFamily] = useState<ColorFamily[]>(source?.colorFamily ?? [])
  const [isFavorite, setIsFavorite] = useState(source?.isFavorite ?? false)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [draftIndicator, setDraftIndicator] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)
  const [pendingPhotoType, setPendingPhotoType] = useState<PhotoType>('BEFORE')

  const recentBrands = getRecentBrands(allRecipes)
  const recentTags = getRecentTags(allRecipes)
  const allTags = [...new Set([...TREATMENT_TAGS, ...recentTags])]

  // Auto-save draft every 10s
  const getDraftData = useCallback(() => ({
    clientName, treatmentDate, treatmentTags, heatTreatment, preTags, postTags,
    memo, photos, hairState, zones, colorFamily, isFavorite, mode,
  }), [clientName, treatmentDate, treatmentTags, heatTreatment, preTags, postTags, memo, photos, hairState, zones, colorFamily, isFavorite, mode])

  useEffect(() => {
    const interval = setInterval(() => {
      saveDraft(getDraftData())
      setDraftIndicator(true)
      setTimeout(() => setDraftIndicator(false), 2000)
    }, 10000)
    return () => clearInterval(interval)
  }, [getDraftData])

  // Restore draft on mount (only for new recipes)
  useEffect(() => {
    if (source) return
    const draft = loadDraft() as Record<string, unknown> | null
    if (draft && draft.zones) {
      const restore = window.confirm('이전에 작성 중이던 레시피가 있습니다. 복구하시겠습니까?')
      if (restore) {
        if (draft.clientName != null) setClientName(draft.clientName as string)
        if (draft.treatmentDate) setTreatmentDate(draft.treatmentDate as string)
        if (draft.treatmentTags) setTreatmentTags(draft.treatmentTags as string[])
        if (draft.memo != null) setMemo(draft.memo as string)
        if (draft.hairState) setHairState(draft.hairState as HairState)
        if (draft.zones) setZones(draft.zones as Zone[])
        if (draft.colorFamily) setColorFamily(draft.colorFamily as ColorFamily[])
        if (draft.mode) setMode(draft.mode as 'quick' | 'detail')
      }
      clearDraft()
    }
  }, [source])

  async function handlePhotoClick(type: PhotoType) {
    setPendingPhotoType(type)
    fileRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoLoading(true)
    try {
      const compressed = await compressImage(file)
      const thumbnail = await createThumbnail(compressed)
      const photoId = generateId()
      const thumbId = photoId + '_thumb'
      await savePhoto(photoId, compressed)
      await savePhoto(thumbId, thumbnail)
      setPhotos(prev => [
        ...prev.filter(p => p.photoType !== pendingPhotoType),
        { id: generateId(), storageKey: photoId, thumbnailKey: thumbId, photoType: pendingPhotoType, sortOrder: 0 },
      ])
    } catch {
      showToast('사진 처리 중 오류가 발생했습니다')
    } finally {
      setPhotoLoading(false)
      e.target.value = ''
    }
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
        ? { ...z, products: [...z.products, { id: generateId(), brandName: 'Wella', shadeCode: '', productType: 'CREAM', ratio: 1, isOxidizer: false }] }
        : z
    ))
  }

  function updateProduct(zoneId: string, productId: string, patch: Partial<ZoneProduct>) {
    setZones(prev => prev.map(z =>
      z.id === zoneId ? { ...z, products: z.products.map(p => p.id === productId ? { ...p, ...patch } : p) } : z
    ))
  }

  function removeProduct(zoneId: string, productId: string) {
    setZones(prev => prev.map(z =>
      z.id === zoneId ? { ...z, products: z.products.filter(p => p.id !== productId) } : z
    ))
  }

  function addCustomTag() {
    const tag = customTag.trim()
    if (tag && !treatmentTags.includes(tag)) {
      setTreatmentTags(prev => [...prev, tag])
    }
    setCustomTag('')
  }

  function handleSave() {
    const now = new Date().toISOString()
    const recipe: Recipe = {
      id: isEdit && source ? source.id : generateId(),
      clientName: clientName || undefined,
      treatmentDate, treatmentTags, heatTreatment,
      preTreatmentTags: preTags, postTreatmentTags: postTags,
      memo: memo || undefined,
      sourceRecipeId: !isEdit && source ? source.id : undefined,
      hairState, zones, photos, colorFamily,
      isFavorite, schemaVersion: CURRENT_SCHEMA_VERSION,
      createdAt: isEdit && source ? source.createdAt : now,
      updatedAt: now,
    }

    const result = validateRecipe(recipe)
    if (!result.valid) {
      showToast(result.errors[0])
      return
    }
    if (result.warnings.length > 0) {
      showToast(result.warnings[0])
    }

    clearDraft()
    onSave(recipe)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <button onClick={onCancel} className="min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer" style={{ color: '#9D174D' }} aria-label="닫기">
          <X size={22} />
        </button>
        <div className="flex items-center gap-2">
          <div className="text-base font-bold" style={{ color: '#831843' }}>{isEdit ? '레시피 수정' : source ? '레시피 복제' : '새 레시피'}</div>
          {draftIndicator && <span className="text-xs" style={{ color: '#10B981' }}>임시저장됨</span>}
        </div>
        <button onClick={handleSave} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-sm font-bold px-3 cursor-pointer" style={{ color: '#EC4899' }}>
          저장
        </button>
      </div>

      {/* Mode toggle */}
      <div className="flex mx-4 mb-3 rounded-full p-1 flex-shrink-0" style={{ backgroundColor: '#fff', boxShadow: 'var(--shadow-sm)' }}>
        {(['quick', 'detail'] as const).map(m => (
          <button
            key={m} onClick={() => setMode(m)}
            className="flex-1 py-2.5 text-sm font-semibold rounded-full transition-all duration-200 cursor-pointer"
            style={mode === m
              ? { background: 'linear-gradient(135deg, #EC4899, #8B5CF6)', color: '#fff', boxShadow: 'var(--shadow-sm)' }
              : { color: '#9D174D', backgroundColor: 'transparent' }
            }
            aria-pressed={mode === m}
          >
            {m === 'quick' ? '빠른 기록' : '상세 기록'}
          </button>
        ))}
      </div>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto no-scroll pb-8">
        <input type="file" accept="image/*" ref={fileRef} onChange={handleFileChange} className="hidden" />

        {/* Photos */}
        <FieldLabel icon={<Camera size={13} style={{ color: '#EC4899' }} />} label="사진" />
        <div className="flex gap-2 px-4 mb-5">
          {(['BEFORE', 'AFTER', 'REFERENCE'] as PhotoType[]).map(type => {
            const photo = photos.find(p => p.photoType === type)
            const labels: Record<PhotoType, string> = { BEFORE: '시술 전', AFTER: '시술 후', REFERENCE: '레퍼런스' }
            return (
              <div
                key={type} onClick={() => handlePhotoClick(type)}
                className="flex-1 aspect-square rounded-xl overflow-hidden cursor-pointer flex items-center justify-center flex-col gap-1 relative active:scale-95 transition-transform"
                style={{ border: '2px dashed #F9A8D4' }}
                aria-label={`${labels[type]} 사진 ${photo ? '변경' : '추가'}`}
              >
                {photoLoading && pendingPhotoType === type ? (
                  <Loader2 size={22} className="animate-spin" style={{ color: '#EC4899' }} />
                ) : photo ? (
                  <PhotoPreview storageKey={photo.thumbnailKey || photo.storageKey} alt={labels[type]} />
                ) : (
                  <>
                    <Camera size={22} style={{ color: '#F9A8D4' }} />
                    <span className="text-xs font-semibold" style={{ color: '#9D174D' }}>{labels[type]}</span>
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* Favorite toggle */}
        <div className="px-4 mb-4 flex items-center gap-2">
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-full cursor-pointer transition-all"
            style={isFavorite
              ? { backgroundColor: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA' }
              : { backgroundColor: '#fff', color: '#9D174D', border: '1px solid #F9A8D4' }
            }
            aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}
            aria-pressed={isFavorite}
          >
            <Heart size={14} fill={isFavorite ? '#EF4444' : 'none'} />
            즐겨찾기
          </button>
        </div>

        {/* Damage level */}
        <FieldLabel icon={<FlaskConical size={13} style={{ color: '#EC4899' }} />} label="손상도" required />
        <div className="mx-4 mb-5 rounded-xl p-4" style={{ backgroundColor: '#fff', boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex justify-between text-xs mb-3">
            <span className="font-semibold" style={{ color: '#9D174D' }}>모발 손상 단계</span>
            <span style={{ color: '#9D174D' }}>1=건강 · 5=극손상</span>
          </div>
          <DamageBar value={hairState.damageLevel} onChange={v => setHairState(s => ({ ...s, damageLevel: v }))} />
        </div>

        {/* Zone section */}
        <FieldLabel icon={<FlaskConical size={13} style={{ color: '#EC4899' }} />} label="구간별 배합" required />
        {zones.map(zone => (
          <ZoneCard
            key={zone.id} zone={zone} recentBrands={recentBrands}
            onUpdate={p => updateZone(zone.id, p)}
            onAddProduct={() => addProduct(zone.id)}
            onUpdateProduct={(pid, p) => updateProduct(zone.id, pid, p)}
            onRemoveProduct={pid => removeProduct(zone.id, pid)}
            onRemove={zones.length > 1 ? () => removeZone(zone.id) : undefined}
          />
        ))}
        <button
          onClick={addZone}
          className="flex items-center justify-center gap-2 mx-4 mb-5 py-3.5 rounded-xl text-sm font-semibold cursor-pointer min-h-[48px]"
          style={{ border: '2px dashed #F9A8D4', color: '#EC4899', backgroundColor: 'transparent' }}
          aria-label="구간 추가"
        >
          <Plus size={16} />구간 추가
        </button>

        {/* Color family */}
        <FieldLabel icon={<Palette size={13} style={{ color: '#EC4899' }} />} label="색상 계열" />
        <div className="px-4 mb-5 flex flex-wrap gap-2">
          {COLOR_FAMILIES.map(cf => (
            <button
              key={cf.value}
              onClick={() => toggleTag(colorFamily, cf.value, setColorFamily)}
              className="text-sm font-semibold px-3.5 py-2 rounded-full cursor-pointer transition-all min-h-[40px] flex items-center gap-1.5"
              style={colorFamily.includes(cf.value)
                ? { backgroundColor: cf.color, color: '#fff' }
                : { backgroundColor: '#fff', color: '#9D174D', border: '1px solid #F9A8D4' }
              }
              aria-pressed={colorFamily.includes(cf.value)}
              aria-label={`색상 계열: ${cf.label}`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colorFamily.includes(cf.value) ? '#fff' : cf.color }} />
              {cf.label}
            </button>
          ))}
        </div>

        {/* Treatment type */}
        <FieldLabel icon={<Layers size={13} style={{ color: '#EC4899' }} />} label="시술 유형" />
        <div className="px-4 mb-5">
          <div className="flex flex-wrap gap-2">
            {allTags.map(t => (
              <button
                key={t} onClick={() => toggleTag(treatmentTags, t, setTreatmentTags)}
                className="text-sm font-semibold px-3.5 py-2 rounded-full cursor-pointer transition-all min-h-[40px]"
                style={treatmentTags.includes(t)
                  ? { backgroundColor: '#8B5CF6', color: '#fff' }
                  : { backgroundColor: '#fff', color: '#9D174D', border: '1px solid #F9A8D4' }
                }
                aria-pressed={treatmentTags.includes(t)}
              >
                {t}
              </button>
            ))}
          </div>
          {/* Custom tag input */}
          <div className="flex gap-2 mt-2">
            <input
              value={customTag} onChange={e => setCustomTag(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomTag()}
              placeholder="커스텀 태그 입력"
              className="flex-1 text-sm rounded-xl px-3 py-2.5 outline-none"
              style={{ backgroundColor: '#fff', border: '1px solid #F9A8D4', color: '#831843' }}
              aria-label="커스텀 시술 태그"
            />
            <button onClick={addCustomTag} className="text-sm font-bold px-3 py-2.5 rounded-xl cursor-pointer" style={{ color: '#EC4899', backgroundColor: '#FDF2F8' }}>
              추가
            </button>
          </div>
          <label className="flex items-center gap-2 mt-3 cursor-pointer min-h-[44px]">
            <input type="checkbox" checked={heatTreatment} onChange={e => setHeatTreatment(e.target.checked)} className="accent-pink-500 w-4 h-4" />
            <span className="text-sm" style={{ color: '#9D174D' }}>열처리</span>
          </label>
          <div className="mt-2">
            <input value={treatmentDate} onChange={e => setTreatmentDate(e.target.value)} type="date"
              className="w-full text-sm rounded-xl px-4 py-3 outline-none min-h-[48px]"
              style={{ color: '#831843', border: '1px solid #F9A8D4', backgroundColor: '#fff' }}
              aria-label="시술 날짜"
            />
          </div>
        </div>

        {/* Client name */}
        <FieldLabel icon={<Layers size={13} style={{ color: '#EC4899' }} />} label="고객 이름 (선택)" />
        <div className="px-4 mb-5">
          <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="직접 입력"
            className="w-full rounded-xl px-4 py-3.5 text-base outline-none min-h-[52px]"
            style={{ backgroundColor: '#fff', boxShadow: 'var(--shadow-sm)', border: '1px solid #F9A8D4', color: '#831843' }}
            aria-label="고객 이름"
          />
        </div>

        {/* Memo */}
        <FieldLabel icon={<Layers size={13} style={{ color: '#EC4899' }} />} label="메모" />
        <div className="px-4 mb-5">
          <textarea value={memo} onChange={e => setMemo(e.target.value)} placeholder="특이사항, 다음 시술 시 주의점..." rows={3}
            className="w-full rounded-xl px-4 py-3.5 text-base outline-none resize-none leading-relaxed"
            style={{ backgroundColor: '#fff', boxShadow: 'var(--shadow-sm)', border: '1px solid #F9A8D4', color: '#831843' }}
            aria-label="메모"
          />
        </div>

        {/* Detail mode only */}
        {mode === 'detail' && (
          <>
            <FieldLabel icon={<FlaskConical size={13} style={{ color: '#EC4899' }} />} label="모발 상세" />
            <div className="px-4 mb-5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: '현재 레벨 (1-10)', key: 'currentLevel', min: 1, max: 10 },
                  { label: '자연 레벨 (1-10)', key: 'naturalLevel', min: 1, max: 10 },
                  { label: '새치 비율 (%)', key: 'grayPercentage', min: 0, max: 100 },
                  { label: '탈색 횟수', key: 'bleachCount', min: 0, max: 20 },
                ].map(({ label, key, min, max }) => (
                  <div key={key} className="rounded-xl px-4 py-3" style={{ backgroundColor: '#fff', boxShadow: 'var(--shadow-sm)', border: '1px solid #F9A8D4' }}>
                    <div className="text-xs mb-1.5" style={{ color: '#9D174D' }}>{label}</div>
                    <input type="number" inputMode="numeric" min={min} max={max}
                      value={(hairState as unknown as Record<string, unknown>)[key] as number ?? ''}
                      onChange={e => setHairState(s => ({ ...s, [key]: e.target.value ? Number(e.target.value) : undefined }))}
                      className="w-full text-base font-semibold outline-none bg-transparent min-h-[32px]"
                      style={{ color: '#831843' }} placeholder="—" aria-label={label}
                    />
                  </div>
                ))}
              </div>
              {/* Hair thickness */}
              <div className="mt-3 rounded-xl px-4 py-3" style={{ backgroundColor: '#fff', boxShadow: 'var(--shadow-sm)', border: '1px solid #F9A8D4' }}>
                <div className="text-xs mb-2" style={{ color: '#9D174D' }}>모발 굵기</div>
                <div className="flex gap-2">
                  {([['THIN', '가는'], ['NORMAL', '보통'], ['THICK', '굵은']] as const).map(([val, label]) => (
                    <button key={val}
                      onClick={() => setHairState(s => ({ ...s, hairThickness: val }))}
                      className="flex-1 py-2.5 text-sm font-semibold rounded-lg cursor-pointer transition-all"
                      style={hairState.hairThickness === val
                        ? { backgroundColor: '#EC4899', color: '#fff' }
                        : { backgroundColor: '#FDF2F8', color: '#9D174D', border: '1px solid #F9A8D4' }
                      }
                      aria-pressed={hairState.hairThickness === val}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Previous color */}
              <div className="mt-3 rounded-xl px-4 py-3" style={{ backgroundColor: '#fff', boxShadow: 'var(--shadow-sm)', border: '1px solid #F9A8D4' }}>
                <div className="text-xs mb-1.5" style={{ color: '#9D174D' }}>이전 시술 색상</div>
                <input value={hairState.previousColor ?? ''} onChange={e => setHairState(s => ({ ...s, previousColor: e.target.value || undefined }))}
                  placeholder="예: 6/1 애쉬 브라운" className="w-full text-base outline-none bg-transparent min-h-[32px]"
                  style={{ color: '#831843' }} aria-label="이전 시술 색상"
                />
              </div>
            </div>

            <FieldLabel icon={<Layers size={13} style={{ color: '#EC4899' }} />} label="전·후처리" />
            <div className="mx-4 mb-5 rounded-xl p-4 space-y-4" style={{ backgroundColor: '#fff', boxShadow: 'var(--shadow-sm)', border: '1px solid #F9A8D4' }}>
              <div>
                <div className="text-xs font-semibold mb-2" style={{ color: '#9D174D' }}>전처리</div>
                <div className="flex flex-wrap gap-2">
                  {PRE_TAGS.map(t => (
                    <button key={t} onClick={() => toggleTag(preTags, t, setPreTags)} className="cursor-pointer min-h-[36px]" aria-pressed={preTags.includes(t)}>
                      <Tag variant={preTags.includes(t) ? 'pre' : 'color'} className={!preTags.includes(t) ? 'opacity-40' : ''}>{t}</Tag>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold mb-2" style={{ color: '#9D174D' }}>후처리</div>
                <div className="flex flex-wrap gap-2">
                  {POST_TAGS.map(t => (
                    <button key={t} onClick={() => toggleTag(postTags, t, setPostTags)} className="cursor-pointer min-h-[36px]" aria-pressed={postTags.includes(t)}>
                      <Tag variant={postTags.includes(t) ? 'post' : 'color'} className={!postTags.includes(t) ? 'opacity-40' : ''}>{t}</Tag>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Save button */}
        <div className="px-4">
          <button onClick={handleSave}
            className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-transform min-h-[56px]"
            style={{ backgroundColor: '#8B5CF6', boxShadow: 'var(--shadow-lg)' }}
          >
            레시피 저장
          </button>
        </div>
      </div>
    </div>
  )
}

function PhotoPreview({ storageKey, alt }: { storageKey: string; alt: string }) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    getPhotoUrl(storageKey).then(setUrl)
  }, [storageKey])
  if (!url) return <Loader2 size={18} className="animate-spin" style={{ color: '#F9A8D4' }} />
  return <img src={url} alt={alt} className="absolute inset-0 w-full h-full object-cover" />
}
