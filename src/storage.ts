import type { Recipe, StoredData } from './types'
import { CURRENT_SCHEMA_VERSION } from './types'

const KEY = 'color_recipes_v2'
const DRAFT_KEY = 'color_recipe_draft'

export function generateId(): string {
  return crypto.randomUUID()
}

function migrateV1(raw: unknown): StoredData {
  // v1: plain Recipe[] in localStorage under 'color_recipes_v1'
  if (Array.isArray(raw)) {
    const recipes = (raw as Record<string, unknown>[]).map(r => ({
      ...r,
      isFavorite: false,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      colorFamily: [],
      photos: ((r.photos as Record<string, unknown>[]) || []).map((p: Record<string, unknown>) => {
        if (p.dataUrl && !p.storageKey) {
          return { ...p, storageKey: '', thumbnailKey: '', dataUrl: p.dataUrl }
        }
        return p
      }),
    })) as unknown as Recipe[]
    return { schemaVersion: CURRENT_SCHEMA_VERSION, recipes }
  }
  return { schemaVersion: CURRENT_SCHEMA_VERSION, recipes: [] }
}

export function loadRecipes(): Recipe[] {
  try {
    // Try v2 first
    const raw2 = localStorage.getItem(KEY)
    if (raw2) {
      const data = JSON.parse(raw2) as StoredData
      return data.recipes
    }
    // Migrate from v1
    const raw1 = localStorage.getItem('color_recipes_v1')
    if (raw1) {
      const migrated = migrateV1(JSON.parse(raw1))
      saveRecipes(migrated.recipes)
      localStorage.removeItem('color_recipes_v1')
      return migrated.recipes
    }
    return []
  } catch {
    return []
  }
}

export function saveRecipes(recipes: Recipe[]): boolean {
  try {
    const data: StoredData = { schemaVersion: CURRENT_SCHEMA_VERSION, recipes }
    localStorage.setItem(KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

export function addRecipe(recipe: Recipe): { recipes: Recipe[]; success: boolean } {
  const recipes = loadRecipes()
  const updated = [recipe, ...recipes]
  const success = saveRecipes(updated)
  return { recipes: updated, success }
}

export function updateRecipe(recipe: Recipe): { recipes: Recipe[]; success: boolean } {
  const recipes = loadRecipes()
  const updated = recipes.map(r => r.id === recipe.id ? recipe : r)
  const success = saveRecipes(updated)
  return { recipes: updated, success }
}

export function deleteRecipe(id: string): { recipes: Recipe[]; success: boolean } {
  const recipes = loadRecipes()
  const updated = recipes.filter(r => r.id !== id)
  const success = saveRecipes(updated)
  return { recipes: updated, success }
}

export function getRecipe(id: string): Recipe | undefined {
  return loadRecipes().find(r => r.id === id)
}

// Draft (auto-save)
export function saveDraft(data: unknown): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
  } catch { /* ignore */ }
}

export function loadDraft(): unknown | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearDraft(): void {
  localStorage.removeItem(DRAFT_KEY)
}

// Storage usage
export function getStorageUsage(): { used: number; label: string } {
  let total = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) total += (localStorage.getItem(key) || '').length * 2 // UTF-16
  }
  const mb = total / (1024 * 1024)
  return { used: total, label: mb < 1 ? `${(mb * 1024).toFixed(0)}KB` : `${mb.toFixed(1)}MB` }
}
