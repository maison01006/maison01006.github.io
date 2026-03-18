import { ArrowLeft, Pencil, Copy, FlaskConical, Layers, ScanLine, MessageSquare, SlidersHorizontal } from 'lucide-react'
import type { Recipe } from '../types'
import Tag from '../components/Tag'
import DamageBar from '../components/DamageBar'

const OX_PCT: Record<number, string> = { 10: '3%', 20: '6%', 30: '9%', 40: '12%' }

interface Props {
  recipe: Recipe
  onBack: () => void
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}

export default function RecipeDetail({ recipe, onBack, onEdit, onDuplicate, onDelete }: Props) {
  const before = recipe.photos.find(p => p.photoType === 'BEFORE')
  const after  = recipe.photos.find(p => p.photoType === 'AFTER')
  const ref    = recipe.photos.find(p => p.photoType === 'REFERENCE')

  const d = new Date(recipe.treatmentDate)
  const dateStr = `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scroll pb-10">
      {/* Photo header */}
      <div className="relative flex h-52 flex-shrink-0">
        <div
          className="flex-1 flex items-end justify-center pb-3 text-xs font-bold text-white"
          style={{ background: before ? undefined : 'linear-gradient(135deg, #4B5563, #6B7280)' }}
        >
          {before && <img src={before.dataUrl} alt="before" className="absolute inset-0 w-1/2 h-full object-cover" />}
          <span className="relative z-10 drop-shadow">시술 전</span>
        </div>
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white z-10" />
        <div
          className="flex-1 flex items-end justify-center pb-3 text-xs font-bold text-white"
          style={{ background: after ? undefined : 'linear-gradient(135deg, #EC4899, #8B5CF6)' }}
        >
          {after && <img src={after.dataUrl} alt="after" className="absolute inset-0 left-1/2 w-1/2 h-full object-cover" />}
          <span className="relative z-10 drop-shadow">시술 후</span>
        </div>

        {ref && (
          <div className="absolute bottom-2.5 right-2.5 w-11 h-11 rounded-lg overflow-hidden border-2 border-white z-20" style={{ boxShadow: 'var(--shadow-lg)' }}>
            <img src={ref.dataUrl} alt="reference" className="w-full h-full object-cover" />
          </div>
        )}

        <button
          onClick={onBack}
          className="absolute top-12 left-3.5 w-9 h-9 rounded-full bg-black/30 backdrop-blur flex items-center justify-center text-white z-20 cursor-pointer"
        >
          <ArrowLeft size={17} />
        </button>
        <div className="absolute top-12 right-3.5 flex gap-2 z-20">
          <button onClick={onEdit} className="w-9 h-9 rounded-full bg-black/30 backdrop-blur flex items-center justify-center text-white cursor-pointer">
            <Pencil size={15} />
          </button>
          <button onClick={onDuplicate} className="w-9 h-9 rounded-full bg-black/30 backdrop-blur flex items-center justify-center text-white cursor-pointer">
            <Copy size={15} />
          </button>
        </div>
      </div>

      {/* Hero card */}
      <div className="mx-4 -mt-5 relative z-10 rounded-2xl p-4" style={{ backgroundColor: '#fff', boxShadow: 'var(--shadow-md)' }}>
        <div className="flex items-start justify-between">
          <div className="flex gap-1.5 flex-wrap flex-1">
            {recipe.treatmentTags.map(t => <Tag key={t} variant="type">{t}</Tag>)}
          </div>
          <span className="text-[11px]" style={{ color: '#F9A8D4' }}>{dateStr}</span>
        </div>
        <div className="text-[13px] mt-2 font-medium" style={{ color: '#9D174D' }}>
          {recipe.clientName || '—'} · 손상도 Lv.{recipe.hairState.damageLevel}
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
              <div className="text-[10px]" style={{ color: '#9D174D' }}>{label}</div>
              <div className="text-sm font-bold mt-0.5" style={{ color: '#EC4899' }}>{value}</div>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <div className="text-[10px] mb-1.5" style={{ color: '#9D174D' }}>손상도</div>
          <DamageBar value={recipe.hairState.damageLevel} readOnly />
        </div>
      </Section>

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
            const oxidizer  = zone.products.find(p => p.isOxidizer)
            const dotColor = zone.applicationOrder === 1 ? '#EC4899' : zone.applicationOrder === 2 ? '#F59E0B' : '#8B5CF6'
            return (
              <div key={zone.id} className="rounded-xl p-3" style={{ backgroundColor: '#fff', border: '1px solid #FDF2F8', boxShadow: 'var(--shadow-sm)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-[13px] font-bold" style={{ color: '#831843' }}>
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor }} />
                    {zone.zoneName}
                    <span
                      className="text-[10px] font-black px-1.5 py-0.5 rounded-full text-white"
                      style={{ background: dotColor }}
                    >
                      {zone.applicationOrder}차
                    </span>
                  </div>
                  <span className="text-[12px] font-bold" style={{ color: '#8B5CF6' }}>{zone.processingTime}분</span>
                </div>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {colorants.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-1">
                      {i > 0 && <span className="text-sm" style={{ color: '#F9A8D4' }}>+</span>}
                      <div className="flex items-center gap-1 rounded-lg px-2 py-1" style={{ backgroundColor: '#FDF2F8', border: '1px solid #F9A8D4' }}>
                        <span className="text-[11px]" style={{ color: '#9D174D' }}>{p.brandName}</span>
                        <span className="text-[12px] font-bold" style={{ color: '#831843' }}>{p.shadeCode}</span>
                        <span className="text-[10px]" style={{ color: '#F9A8D4' }}>×{p.ratio}</span>
                      </div>
                    </div>
                  ))}
                  {oxidizer && (
                    <>
                      <span className="text-sm" style={{ color: '#F9A8D4' }}>+</span>
                      <div className="rounded-lg px-2 py-1 text-[12px] font-bold" style={{ backgroundColor: '#EDE9FE', border: '1px solid #C4B5FD', color: '#8B5CF6' }}>
                        {oxidizer.oxidizerVolume
                          ? `${OX_PCT[oxidizer.oxidizerVolume]} (${oxidizer.oxidizerVolume}vol)`
                          : '산화제'
                        } ×{oxidizer.ratio}
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
          <div className="rounded-xl p-3 text-[13px] leading-relaxed" style={{ backgroundColor: '#FDF2F8', color: '#9D174D' }}>
            {recipe.memo}
          </div>
        </Section>
      )}

      {/* Hair state detail */}
      <Section title="모발 상세" icon={<ScanLine size={14} style={{ color: '#EC4899' }} />}>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: '손상도', value: `Lv.${recipe.hairState.damageLevel}` },
            { label: '현재 레벨', value: recipe.hairState.currentLevel ? `Lv.${recipe.hairState.currentLevel}` : '—' },
            { label: '새치 비율', value: recipe.hairState.grayPercentage != null ? `${recipe.hairState.grayPercentage}%` : '—' },
            { label: '자연 레벨', value: recipe.hairState.naturalLevel ? `Lv.${recipe.hairState.naturalLevel}` : '—' },
            { label: '모발 굵기', value: recipe.hairState.hairThickness === 'THIN' ? '가는' : recipe.hairState.hairThickness === 'THICK' ? '굵은' : '보통' },
            { label: '탈색 횟수', value: recipe.hairState.bleachCount != null ? `${recipe.hairState.bleachCount}회` : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl p-2.5 text-center" style={{ backgroundColor: '#fff', boxShadow: 'var(--shadow-sm)', border: '1px solid #FDF2F8' }}>
              <div className="text-[10px] mb-0.5" style={{ color: '#F9A8D4' }}>{label}</div>
              <div className="text-[15px] font-bold" style={{ color: '#EC4899' }}>{value}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Actions */}
      <div className="px-4 mt-4 space-y-2">
        <button
          onClick={onDuplicate}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold cursor-pointer transition-all duration-200 active:scale-[0.98]"
          style={{ backgroundColor: '#fff', border: '2px solid #EC4899', color: '#EC4899' }}
        >
          <Copy size={17} />이 레시피 복제하기
        </button>
        <button
          onClick={onDelete}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium cursor-pointer transition-all duration-200"
          style={{ backgroundColor: '#fff', border: '1px solid #FCA5A5', color: '#EF4444' }}
        >
          레시피 삭제
        </button>
      </div>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="px-4 mt-4">
      <div className="flex items-center gap-1.5 text-[13px] font-bold mb-2.5" style={{ color: '#831843' }}>
        {icon}{title}
      </div>
      {children}
    </div>
  )
}
