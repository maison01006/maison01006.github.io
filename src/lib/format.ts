import type { Recipe } from '../types'
import { OX_PCT } from '../constants'

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return '오늘'
  if (diff === 1) return '어제'
  if (diff < 7) return `${diff}일 전`
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export function oxLabel(vol: number): string {
  return `${OX_PCT[vol]} (${vol}vol)`
}

export function formulaSummary(recipe: Recipe): string {
  return recipe.zones.map(z => {
    const colorants = z.products.filter(p => !p.isOxidizer)
    const ox = z.products.find(p => p.isOxidizer)
    const formula = colorants.map(p => `${p.brandName} ${p.shadeCode}`).join('+')
    const oxStr = ox?.oxidizerVolume ? ` · ${oxLabel(ox.oxidizerVolume)}` : ''
    return `${z.zoneName}: ${formula}${oxStr} ${z.processingTime}분`
  }).join('  /  ')
}
