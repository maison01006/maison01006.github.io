import type { Recipe, Zone } from '../types'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export function validateRecipe(recipe: Partial<Recipe>): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!recipe.zones || recipe.zones.length === 0) {
    errors.push('최소 1개 구간이 필요합니다')
  } else {
    recipe.zones.forEach((z, i) => {
      const nonOx = z.products.filter(p => !p.isOxidizer)
      if (nonOx.length === 0) {
        errors.push(`구간 ${i + 1}: 비산화제 제품이 최소 1개 필요합니다`)
      }
      if (z.processingTime <= 0) {
        errors.push(`구간 ${i + 1}: 방치 시간은 0보다 커야 합니다`)
      }
      z.products.forEach(p => {
        if (p.ratio <= 0) errors.push(`구간 ${i + 1}: 비율은 0보다 커야 합니다`)
        if (!p.isOxidizer && !p.shadeCode.trim()) {
          warnings.push(`구간 ${i + 1}: 호수 코드가 비어있는 제품이 있습니다`)
        }
      })
    })
  }

  const hs = recipe.hairState
  if (!hs || hs.damageLevel < 1 || hs.damageLevel > 5) {
    errors.push('손상도(1-5)를 선택해주세요')
  }
  if (hs?.currentLevel != null && (hs.currentLevel < 1 || hs.currentLevel > 10)) {
    errors.push('현재 레벨은 1-10 범위여야 합니다')
  }
  if (hs?.naturalLevel != null && (hs.naturalLevel < 1 || hs.naturalLevel > 10)) {
    errors.push('자연 레벨은 1-10 범위여야 합니다')
  }
  if (hs?.grayPercentage != null && (hs.grayPercentage < 0 || hs.grayPercentage > 100)) {
    errors.push('새치 비율은 0-100 범위여야 합니다')
  }

  if (!recipe.photos || recipe.photos.length === 0) {
    warnings.push('사진이 없습니다. 나중에 추가할 수 있습니다.')
  }

  return { valid: errors.length === 0, errors, warnings }
}

export function validateZone(zone: Zone): string[] {
  const errors: string[] = []
  if (zone.products.filter(p => !p.isOxidizer).length === 0) {
    errors.push('비산화제 제품이 최소 1개 필요합니다')
  }
  if (zone.processingTime <= 0) {
    errors.push('방치 시간은 0보다 커야 합니다')
  }
  return errors
}
