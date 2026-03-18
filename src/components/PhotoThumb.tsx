import type { Photo } from '../types'

interface Props {
  before?: Photo
  after?: Photo
  size?: number
  className?: string
}

export default function PhotoThumb({ before, after, size = 76, className = '' }: Props) {
  return (
    <div
      className={`flex rounded-xl overflow-hidden flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <div
        className="flex-1 flex items-center justify-center text-[9px] font-bold text-white"
        style={{ background: before ? undefined : 'linear-gradient(135deg, #4B5563, #6B7280)' }}
      >
        {before
          ? <img src={before.dataUrl} alt="before" className="w-full h-full object-cover" />
          : '전'}
      </div>
      <div
        className="flex-1 flex items-center justify-center text-[9px] font-bold text-white"
        style={{ background: after ? undefined : 'linear-gradient(135deg, #EC4899, #8B5CF6)' }}
      >
        {after
          ? <img src={after.dataUrl} alt="after" className="w-full h-full object-cover" />
          : '후'}
      </div>
    </div>
  )
}
