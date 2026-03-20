import type { ColorFamily } from './types'

export const BRANDS = [
  'Wella', "L'Oreal", 'Igora', 'Goldwell', 'Davines', 'Pravana',
  '아모스', '르네휘테르', '에이솔', '미쟝센 프로', '무겐', '나카노',
]

export const TREATMENT_TAGS = [
  '발레아쥬', '커버그레이', '전체 염색', '탈색 후 염색',
  '하이라이트', '뿌리 리터치', '옴브레', '에어터치',
]

export const PRE_TAGS = ['올라플렉스 No.1', '두피보호제', 'PPT', '파이버플렉스', '케라틴 처리']
export const POST_TAGS = ['산성 샴푸', '컬러락', '트리트먼트', '올라플렉스 No.2']

export const OX_VOLS: Array<10 | 20 | 30 | 40> = [10, 20, 30, 40]
export const OX_PCT: Record<number, string> = { 10: '3%', 20: '6%', 30: '9%', 40: '12%' }

export const COLOR_FAMILIES: { value: ColorFamily; label: string; color: string }[] = [
  { value: 'ASH', label: '애쉬', color: '#6B7280' },
  { value: 'GOLD', label: '골드', color: '#F59E0B' },
  { value: 'COPPER', label: '코퍼', color: '#EA580C' },
  { value: 'VIOLET', label: '바이올렛', color: '#8B5CF6' },
  { value: 'NATURAL', label: '내추럴', color: '#78716C' },
  { value: 'FANTASY', label: '판타지', color: '#EC4899' },
]

export const FILTER_TAGS = ['전체', ...TREATMENT_TAGS]
