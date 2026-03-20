import { useState, useEffect } from 'react'
import { ImageOff } from 'lucide-react'
import type { Photo } from '../types'
import { getPhotoUrl } from '../photoStorage'

interface Props {
  before?: Photo
  after?: Photo
  size?: number
  className?: string
}

export default function PhotoThumb({ before, after, size = 76, className = '' }: Props) {
  const [beforeUrl, setBeforeUrl] = useState('')
  const [afterUrl, setAfterUrl] = useState('')

  useEffect(() => {
    if (before?.storageKey) getPhotoUrl(before.thumbnailKey || before.storageKey).then(setBeforeUrl)
    else setBeforeUrl('')
  }, [before])

  useEffect(() => {
    if (after?.storageKey) getPhotoUrl(after.thumbnailKey || after.storageKey).then(setAfterUrl)
    else setAfterUrl('')
  }, [after])

  const hasPhotos = before || after

  return (
    <div
      className={`flex rounded-xl overflow-hidden flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-label={hasPhotos ? '시술 전후 사진' : '사진 미등록'}
    >
      <div
        className="flex-1 flex items-center justify-center text-xs font-bold text-white"
        style={{ background: beforeUrl ? undefined : 'linear-gradient(135deg, #4B5563, #6B7280)' }}
      >
        {beforeUrl
          ? <img src={beforeUrl} alt="시술 전" className="w-full h-full object-cover" />
          : <span className="flex flex-col items-center gap-0.5"><ImageOff size={14} opacity={0.6} /><span className="text-[9px] opacity-60">전</span></span>
        }
      </div>
      <div
        className="flex-1 flex items-center justify-center text-xs font-bold text-white"
        style={{ background: afterUrl ? undefined : 'linear-gradient(135deg, #EC4899, #8B5CF6)' }}
      >
        {afterUrl
          ? <img src={afterUrl} alt="시술 후" className="w-full h-full object-cover" />
          : <span className="flex flex-col items-center gap-0.5"><ImageOff size={14} opacity={0.6} /><span className="text-[9px] opacity-60">후</span></span>
        }
      </div>
    </div>
  )
}
