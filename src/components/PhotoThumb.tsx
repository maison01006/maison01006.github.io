import type { Photo } from '../types'

interface Props {
  before?: Photo
  after?: Photo
  size?: number
  className?: string
}

const BEFORE_GRADIENT = 'linear-gradient(135deg, #4B5563, #6B7280)'
const AFTER_COLORS: Record<string, string> = {
  '발레아쥬': 'linear-gradient(135deg, #EC4899, #BE185D)',
  '커버그레이': 'linear-gradient(135deg, #78350F, #A16207)',
  '전체 염색': 'linear-gradient(135deg, #F472B6, #EC4899)',
  '탈색': 'linear-gradient(135deg, #FDE68A, #F59E0B)',
  default: 'linear-gradient(135deg, #EC4899, #8B5CF6)',
}

export default function PhotoThumb({ before, after, size = 76, className = '' }: Props) {
  return (
    <div
      className={`flex rounded-xl overflow-hidden flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <div
        className="flex-1 flex items-center justify-center text-[9px] font-bold text-white"
        style={{ background: before ? undefined : BEFORE_GRADIENT }}
      >
        {before
          ? <img src={before.dataUrl} alt="before" className="w-full h-full object-cover" />
          : '전'}
      </div>
      <div
        className="flex-1 flex items-center justify-center text-[9px] font-bold text-white"
        style={{ background: after ? undefined : AFTER_COLORS.default }}
      >
        {after
          ? <img src={after.dataUrl} alt="after" className="w-full h-full object-cover" />
          : '후'}
      </div>
    </div>
  )
}
