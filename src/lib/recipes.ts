import type { Recipe } from '../types'
import { loadRecipes, saveRecipes, generateId } from '../storage'
import { loadPhoto, deletePhoto, getAllPhotoKeys, savePhoto } from '../photoStorage'
import { CURRENT_SCHEMA_VERSION } from '../types'

export function createRecipe(data: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'schemaVersion'>): Recipe {
  const now = new Date().toISOString()
  return {
    ...data,
    id: generateId(),
    schemaVersion: CURRENT_SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
  }
}

export function duplicateRecipe(source: Recipe): Recipe {
  const now = new Date().toISOString()
  return {
    ...source,
    id: generateId(),
    sourceRecipeId: source.id,
    isFavorite: false,
    createdAt: now,
    updatedAt: now,
  }
}

export function prepareEditRecipe(recipe: Recipe): Recipe {
  return {
    ...recipe,
    updatedAt: new Date().toISOString(),
  }
}

// Export all data as a downloadable zip
export async function exportData(): Promise<Blob> {
  const recipes = loadRecipes()
  const manifest = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportDate: new Date().toISOString(),
    recipeCount: recipes.length,
  }

  // Collect photo blobs
  const photoEntries: { name: string; blob: Blob }[] = []
  for (const r of recipes) {
    for (const p of r.photos) {
      if (p.storageKey) {
        const blob = await loadPhoto(p.storageKey)
        if (blob) photoEntries.push({ name: `photos/${p.storageKey}.jpg`, blob })
      }
      if (p.thumbnailKey) {
        const blob = await loadPhoto(p.thumbnailKey)
        if (blob) photoEntries.push({ name: `photos/${p.thumbnailKey}.jpg`, blob })
      }
    }
  }

  // Build a simple concatenated format (no zip library needed for MVP)
  // Use JSON with base64 encoded photos
  const photosData: Record<string, string> = {}
  for (const entry of photoEntries) {
    const reader = new FileReader()
    const base64 = await new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(entry.blob)
    })
    photosData[entry.name] = base64
  }

  const exportObj = { manifest, recipes, photos: photosData }
  return new Blob([JSON.stringify(exportObj)], { type: 'application/json' })
}

export async function importData(file: File, mode: 'merge' | 'overwrite'): Promise<{ count: number }> {
  const text = await file.text()
  const data = JSON.parse(text)
  const importedRecipes: Recipe[] = data.recipes || []
  const photos: Record<string, string> = data.photos || {}

  // Restore photos to IndexedDB
  for (const [, dataUrl] of Object.entries(photos)) {
    const key = Object.keys(photos).find(k => photos[k] === dataUrl)
    if (key) {
      const name = key.replace('photos/', '').replace('.jpg', '')
      const resp = await fetch(dataUrl)
      const blob = await resp.blob()
      await savePhoto(name, blob)
    }
  }

  if (mode === 'overwrite') {
    // Delete existing photos
    const existingKeys = await getAllPhotoKeys()
    for (const k of existingKeys) {
      if (!Object.keys(photos).some(pk => pk.includes(k))) {
        await deletePhoto(k)
      }
    }
    saveRecipes(importedRecipes)
    return { count: importedRecipes.length }
  }

  // Merge
  const existing = loadRecipes()
  const existingIds = new Set(existing.map(r => r.id))
  const newRecipes = importedRecipes.filter(r => !existingIds.has(r.id))
  saveRecipes([...newRecipes, ...existing])
  return { count: newRecipes.length }
}
