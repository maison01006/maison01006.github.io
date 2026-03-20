import type { Recipe, ColorFamily } from '../types'

export function searchRecipes(
  recipes: Recipe[],
  query: string,
  filterTag: string,
  filterColorFamily: ColorFamily | null,
  favoritesOnly: boolean,
): Recipe[] {
  let list = recipes

  if (favoritesOnly) {
    list = list.filter(r => r.isFavorite)
  }

  if (filterTag !== '전체') {
    list = list.filter(r => r.treatmentTags.includes(filterTag))
  }

  if (filterColorFamily) {
    list = list.filter(r => r.colorFamily?.includes(filterColorFamily))
  }

  if (query.trim()) {
    const q = query.toLowerCase().trim()
    const isNumeric = /^\d+/.test(q)

    list = list.filter(r => {
      // Numeric: prioritize shade code and level matching
      if (isNumeric) {
        const shadeMatch = r.zones.some(z =>
          z.products.some(p => p.shadeCode.toLowerCase().startsWith(q))
        )
        if (shadeMatch) return true
        const levelMatch =
          r.hairState.currentLevel?.toString() === q ||
          r.hairState.naturalLevel?.toString() === q
        if (levelMatch) return true
      }

      return (
        (r.clientName || '').toLowerCase().includes(q) ||
        r.treatmentTags.some(t => t.toLowerCase().includes(q)) ||
        (r.memo || '').toLowerCase().includes(q) ||
        r.zones.some(z =>
          z.products.some(p =>
            p.brandName.toLowerCase().includes(q) ||
            p.shadeCode.toLowerCase().includes(q)
          )
        )
      )
    })
  }

  return list
}

export function getRecentBrands(recipes: Recipe[], limit = 5): string[] {
  const counts = new Map<string, number>()
  for (const r of recipes) {
    for (const z of r.zones) {
      for (const p of z.products) {
        if (!p.isOxidizer && p.brandName) {
          counts.set(p.brandName, (counts.get(p.brandName) || 0) + 1)
        }
      }
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name]) => name)
}

export function getRecentTags(recipes: Recipe[]): string[] {
  const counts = new Map<string, number>()
  for (const r of recipes) {
    for (const t of r.treatmentTags) {
      counts.set(t, (counts.get(t) || 0) + 1)
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)
}
