import { useState, useEffect } from 'react'
import { ArrowLeft, Pencil, Copy, FlaskConical, Layers, ScanLine, MessageSquare, SlidersHorizontal, Heart, Palette } from 'lucide-react'
import type { Recipe } from '../types'
import { COLOR_FAMILIES } from '../constants'
import { oxLabel } from '../lib/format'
import { getPhotoUrl } from '../photoStorage'
import Tag from '../components/Tag'
import DamageBar from '../components/DamageBar'
import ConfirmDialog from '../components/ConfirmDialog'
import { showToast } from '../components/Toast'

interface Props {
  recipe: Recipe
  onBack: () => void
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
  onToggleFavorite: () => void
}

export default function RecipeDetail({ recipe, onBack, onEdit, onDuplicate, onDelete, onToggleFavorite }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [beforeUrl, setBeforeUrl] = useState('')
  const [afterUrl, setAfterUrl] = useState('')
  const [refUrl, setRefUrl] = useState('')

  const before = recipe.photos.find(p => p.photoType === 'BEFORE')
  const after = recipe.photos.find(p => p.photoType === 'AFTER')
  const ref = recipe.photos.find(p => p.photoType === 'REFERENCE')

  useEffect(() => {
    if (before?.storageKey) getPhotoUrl(before.storageKey).then(setBeforeUrl)
    else setBeforeUrl('')
  }, [before])
  useEffect(() => {
    if (after?.storageKey) getPhotoUrl(after.storageKey).then(setAfterUrl)
    else setAfterUrl('')
  }, [after])
  useEffect(() => {
    if (ref?.storageKey) getPhotoUrl(ref.storageKey).then(setRefUrl)
    else setRefUrl('')
  }, [ref])

  const d = new Date(recipe.treatmentDate)
  const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`

  function handleDeleteConfirm() {
    setConfirmDelete(false)
    onDelete()
    showToast('레시피가 삭제되었습니다')
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scroll pb-10">
      {/* Photo header */}
      <div className="relative flex h-52 flex-shrink-0">
        <div className="flex-1 flex items-end justify-center pb-3 text-xs font-bold text-white"
          style={{ background: beforeUrl ? undefined : 'linear-gradient(135deg, #4B5563, #6B7280)' }}>
          {beforeUrl && <img src={beforeUrl} alt="시술 전" className="absolute inset-0 w-1/2 h-full object-cover" />}
          <span className="relative z-10 drop-shadow">시술 전</span>
        </div>
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white z-10" />
        <div className="flex-1 flex items-end justify-center pb-3 text-xs font-bold text-white"
          style={{ background: afterUrl ? undefined : 'linear-gradient(135deg, #EC4899, #8B5CF6)' }}>
          {afterUrl && <img src={afterUrl} alt="시술 후" className="absolute inset-0 left-1/2 w-1/2 h-full object-cover" />}
          <span className="relative z-10 drop-shadow">시술 후</span>
        </div>

        {refUrl && (
          <div className="absolute bottom-2.5 right-2.5 w-11 h-11 rounded-lg overflow-hidden border-2 border-white z-20" style={{ boxShadow: 'var(--shadow-lg)' }}>
            <img src={refUrl} alt="레퍼런스" className="w-full h-full object-cover" />
          </div>
        )}

        <button onClick={onBack} className="absolute top-12 left-3.5 w-9 h-9 rounded-full bg-black/30 backdrop-blur flex items-center justify-center text-white z-20 cursor-pointer" aria-label="뒤로">
          <ArrowLeft size={17} />
        </button>
        <div className="absolute top-12 right-3.5 flex gap-2 z-20">
          <button onClick={onToggleFavorite} className="w-9 h-9 rounded-full bg-black/30 backdrop-blur flex items-center justify-center text-white cursor-pointer" aria-label={recipe.isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}>
            <Heart size={15} fill={recipe.isFavorite ? '#EF4444' : 'none'} />
          </button>
          <button onClick={onEdit} className="w-9 h-9 rounded-full bg-black/30 backdrop-blur flex items-center justify-center text-white cursor-pointer" aria-label="수정">
            <Pencil size={15} />
          </button>
          <button onClick={onDuplicate} className="w-9 h-9 rounded-full bg-black/30 backdrop-blur flex items-center justify-center text-white cursor-pointer" aria-label="복제">
            <Copy size={15} />
          </button>
        </div>
      </div>

      {/* Hero card */}
      <div className="mx-4 -mt-5 relative z-10 rounded-2xl p-4" style={{ backgroundColor: '#fff', boxShadow: 'var(--shadow-md)' }}>
        <div className="flex items-start justify-between">
          <div className="flex gap-1.5 flex-wrap flex-1">
            {recipe.treatmentTags.map(t => <Tag key={t} variant="type">{t}</Tag>)}
            {recipe.colorFamily?.map(cf => {
              const info = COLOR_FAMILIES.find(c => c.value === cf)
              return info ? <Tag key={cf} variant="family">{info.label}</Tag> : null
            })}
          </div>
          <span className="text-xs" style={{ color: '#9D174D' }}>{dateStr}</span>
        </div>
        <div className="text-sm mt-2 font-medium" style={{ color: '#9D174D' }}>
          {recipe.clientName || '—'} · 손상도 Lv.{recipe.hairState.damageLevel}
          {recipe.isFavorite && <Heart size={12} fill="#EF4444" className="inline ml-1" style={{ color: '#EF4444' }} />}
        </div>
      </div>

      {/* Conditions */}
      <Section title="시술 조건" icon={<SlidersHorizontal size={14} style={{ color: '#EC4899' }} />}>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: '현재 레벨', value: recipe.hairState.currentLevel ? `Lv.${recipe.hairState.currentLevel}` : '—' },
            { label: '자연 레벨', value: recipe.hairState.naturalLevel ? `Lv.${recipe.hairState.naturalLevel}` : '—' },
            { label: '새치', value: recipe.hairState.grayPercentage != null ? `${recipe.hairState.grayPercentage}%` : '—' },
            { label: '탈색', value: recipe.hairState.bleachCount != null ? `${recipe.hairState.bleachCount}회` : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl p-2.5 text-center" style={{ backgroundColor: '#FDF2F8' }}>
              <div className="text-xs" style={{ color: '#9D174D' }}>{label}</div>
              <div className="text-sm font-bold mt-0.5" style={{ color: '#EC4899' }}>{value}</div>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <div className="text-xs mb-1.5" style={{ color: '#9D174D' }}>손상도</div>
          <DamageBar value={recipe.hairState.damageLevel} readOnly />
        </div>
      </Section>

      {/* Hair detail */}
      <Section title="모발 상세" icon={<ScanLine size={14} style={{ color: '#EC4899' }} />}>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: '모발 굵기', value: recipe.hairState.hairThickness === 'THIN' ? '가는' : recipe.hairState.hairThickness === 'THICK' ? '굵은' : '보통' },
            { label: '이전 색상', value: recipe.hairState.previousColor || '—' },
            { label: '열처리', value: recipe.heatTreatment ? '예' : '아니오' },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl p-2.5 text-center" style={{ backgroundColor: '#fff', boxShadow: 'var(--shadow-sm)', border: '1px solid #FDF2F8' }}>
              <div className="text-xs mb-0.5" style={{ color: '#9D174D' }}>{label}</div>
              <div className="text-sm font-bold" style={{ color: '#EC4899' }}>{value}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Color family */}
      {recipe.colorFamily && recipe.colorFamily.length > 0 && (
        <Section title="색상 계열" icon={<Palette size={14} style={{ color: '#EC4899' }} />}>
          <div className="flex gap-2 flex-wrap">
            {recipe.colorFamily.map(cf => {
              const info = COLOR_FAMILIES.find(c => c.value === cf)
              return info ? (
                <span key={cf} className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5" style={{ backgroundColor: info.color, color: '#fff' }}>
                  {info.label}
                </span>
              ) : null
            })}
          </div>
        </Section>
      )}

      {/* Pre/Post treatment */}
      {(recipe.preTreatmentTags.length > 0 || recipe.postTreatmentTags.length > 0) && (
        <Section title="전·후처리" icon={<Layers size={14} style={{ color: '#EC4899' }} />}>
          {recipe.preTreatmentTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {recipe.preTreatmentTags.map(t => <Tag key={t} variant="pre">{t}</Tag>)}
            </div>
          )}
          {recipe.postTreatmentTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {recipe.postTreatmentTags.map(t => <Tag key={t} variant="post">{t}</Tag>)}
            </div>
          )}
        </Section>
      )}

      {/* Zone formulation */}
      <Section title="구간별 배합" icon={<FlaskConical size={14} style={{ color: '#EC4899' }} />}>
        <div className="space-y-2.5">
          {recipe.zones.map(zone => {
            const colorants = zone.products.filter(p => !p.isOxidizer)
            const oxidizer = zone.products.find(p => p.isOxidizer)
            const dotColor = zone.applicationOrder === 1 ? '#EC4899' : zone.applicationOrder === 2 ? '#F59E0B' : '#8B5CF6'
            return (
              <div key={zone.id} className="rounded-xl p-3" style={{ backgroundColor: '#fff', border: '1px solid #FDF2F8', boxShadow: 'var(--shadow-sm)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-sm font-bold" style={{ color: '#831843' }}>
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor }} aria-hidden="true" />
                    {zone.zoneName}
                    <span className="text-xs font-black px-1.5 py-0.5 rounded-full text-white" style={{ background: dotColor }}>
                      {zone.applicationOrder}차
                    </span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: '#8B5CF6' }}>{zone.processingTime}분</span>
                </div>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {colorants.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-1">
                      {i > 0 && <span className="text-sm" style={{ color: '#9D174D' }}>+</span>}
                      <div className="flex items-center gap-1 rounded-lg px-2 py-1" style={{ backgroundColor: '#FDF2F8', border: '1px solid #F9A8D4' }}>
                        <span className="text-xs" style={{ color: '#9D174D' }}>{p.brandName}</span>
                        <span className="text-xs font-bold" style={{ color: '#831843' }}>{p.shadeCode}</span>
                        <span className="text-xs" style={{ color: '#9D174D' }}>×{p.ratio}</span>
                        {p.amountGram && <span className="text-xs" style={{ color: '#9D174D' }}>({p.amountGram}g)</span>}
                      </div>
                    </div>
                  ))}
                  {oxidizer && (
                    <>
                      <span className="text-sm" style={{ color: '#9D174D' }}>+</span>
                      <div className="rounded-lg px-2 py-1 text-xs font-bold" style={{ backgroundColor: '#EDE9FE', border: '1px solid #C4B5FD', color: '#8B5CF6' }}>
                        {oxidizer.oxidizerVolume ? oxLabel(oxidizer.oxidizerVolume) : '산화제'} ×{oxidizer.ratio}
                        {oxidizer.amountGram && <span className="font-normal ml-1">({oxidizer.amountGram}g)</span>}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Section>

      {/* Memo */}
      {recipe.memo && (
        <Section title="메모" icon={<MessageSquare size={14} style={{ color: '#EC4899' }} />}>
          <div className="rounded-xl p-3 text-sm leading-relaxed" style={{ backgroundColor: '#FDF2F8', color: '#9D174D' }}>
            {recipe.memo}
          </div>
        </Section>
      )}

      {/* Actions */}
      <div className="px-4 mt-4 space-y-2">
        <button onClick={onDuplicate}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold cursor-pointer active:scale-[0.98] transition-transform"
          style={{ backgroundColor: '#fff', border: '2px solid #EC4899', color: '#EC4899' }}
        >
          <Copy size={17} />이 레시피 복제하기
        </button>
        <button onClick={() => setConfirmDelete(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium cursor-pointer"
          style={{ backgroundColor: '#fff', border: '1px solid #FCA5A5', color: '#EF4444' }}
        >
          레시피 삭제
        </button>
      </div>

      <ConfirmDialog
        visible={confirmDelete}
        title="레시피 삭제"
        message="이 레시피를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmLabel="삭제"
        cancelLabel="취소"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDelete(false)}
        destructive
      />
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="px-4 mt-4">
      <div className="flex items-center gap-1.5 text-sm font-bold mb-2.5" style={{ color: '#831843' }}>
        {icon}{title}
      </div>
      {children}
    </div>
  )
}
