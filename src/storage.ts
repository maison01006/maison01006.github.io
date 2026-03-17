import type { Recipe } from './types'

const KEY = 'color_recipes_v1'

export function loadRecipes(): Recipe[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveRecipes(recipes: Recipe[]): void {
  localStorage.setItem(KEY, JSON.stringify(recipes))
}

export function addRecipe(recipe: Recipe): Recipe[] {
  const recipes = loadRecipes()
  const updated = [recipe, ...recipes]
  saveRecipes(updated)
  return updated
}

export function updateRecipe(recipe: Recipe): Recipe[] {
  const recipes = loadRecipes()
  const updated = recipes.map(r => r.id === recipe.id ? recipe : r)
  saveRecipes(updated)
  return updated
}

export function deleteRecipe(id: string): Recipe[] {
  const recipes = loadRecipes()
  const updated = recipes.filter(r => r.id !== id)
  saveRecipes(updated)
  return updated
}

export function getRecipe(id: string): Recipe | undefined {
  return loadRecipes().find(r => r.id === id)
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}
