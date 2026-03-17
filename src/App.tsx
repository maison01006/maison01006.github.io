import { useState, useEffect } from 'react'
import type { Recipe, Screen } from './types'
import { loadRecipes, saveRecipes, addRecipe, updateRecipe, deleteRecipe, getRecipe } from './storage'
import { SEED_RECIPES } from './seed'
import RecipeFeed from './screens/RecipeFeed'
import RecipeDetail from './screens/RecipeDetail'
import CreateRecipe from './screens/CreateRecipe'

export default function App() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [screen, setScreen] = useState<Screen>({ type: 'FEED' })

  useEffect(() => {
    let stored = loadRecipes()
    if (stored.length === 0) {
      stored = SEED_RECIPES
      saveRecipes(stored)
    }
    setRecipes(stored)
  }, [])

  function handleSave(recipe: Recipe) {
    const existing = recipes.find(r => r.id === recipe.id)
    const updated = existing ? updateRecipe(recipe) : addRecipe(recipe)
    setRecipes(updated)
    setScreen({ type: 'DETAIL', recipeId: recipe.id })
  }

  function handleDelete(id: string) {
    const updated = deleteRecipe(id)
    setRecipes(updated)
    setScreen({ type: 'FEED' })
  }

  const currentRecipe = screen.type === 'DETAIL' ? getRecipe(screen.recipeId) : null

  return (
    <div className="flex justify-center min-h-screen bg-gray-100">
      <div
        className="relative w-full max-w-[390px] min-h-screen bg-[#FFF8FB] overflow-hidden shadow-2xl"
        style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
      >
        {screen.type === 'FEED' && (
          <RecipeFeed
            recipes={recipes}
            onSelect={id => setScreen({ type: 'DETAIL', recipeId: id })}
            onCreate={() => setScreen({ type: 'CREATE' })}
          />
        )}

        {screen.type === 'CREATE' && (
          <CreateRecipe
            source={screen.sourceRecipe}
            onSave={handleSave}
            onCancel={() => setScreen({ type: 'FEED' })}
          />
        )}

        {screen.type === 'DETAIL' && currentRecipe && (
          <RecipeDetail
            recipe={currentRecipe}
            onBack={() => setScreen({ type: 'FEED' })}
            onEdit={() => setScreen({ type: 'CREATE', sourceRecipe: currentRecipe })}
            onDuplicate={() => {
              const dupe = { ...currentRecipe, id: Date.now().toString(36) }
              setScreen({ type: 'CREATE', sourceRecipe: dupe })
            }}
            onDelete={() => handleDelete(currentRecipe.id)}
          />
        )}

        {screen.type === 'DETAIL' && !currentRecipe && (
          <div className="flex items-center justify-center py-32 text-gray-400 text-sm">
            레시피를 찾을 수 없습니다.
            <button onClick={() => setScreen({ type: 'FEED' })} className="ml-2 text-pink-500 underline cursor-pointer">
              목록으로
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
