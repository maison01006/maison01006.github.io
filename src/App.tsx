import { useState, useEffect, useCallback } from 'react'
import type { Recipe, Screen } from './types'
import { loadRecipes, saveRecipes, addRecipe, updateRecipe, deleteRecipe, getRecipe } from './storage'
import { SEED_RECIPES } from './seed'
import { duplicateRecipe } from './lib/recipes'
import { showToast } from './components/Toast'
import ToastContainer from './components/Toast'
import RecipeFeed from './screens/RecipeFeed'
import RecipeDetail from './screens/RecipeDetail'
import CreateRecipe from './screens/CreateRecipe'

export default function App() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [screen, setScreen] = useState<Screen>({ type: 'FEED' })

  const refreshRecipes = useCallback(() => {
    setRecipes(loadRecipes())
  }, [])

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
    const result = existing ? updateRecipe(recipe) : addRecipe(recipe)
    if (result.success) {
      setRecipes(result.recipes)
      setScreen({ type: 'DETAIL', recipeId: recipe.id })
      showToast('레시피가 저장되었습니다')
    } else {
      showToast('저장에 실패했습니다. 저장소 용량을 확인해주세요.')
    }
  }

  function handleDelete(id: string) {
    const recipe = getRecipe(id)
    const result = deleteRecipe(id)
    if (result.success) {
      setRecipes(result.recipes)
      setScreen({ type: 'FEED' })
      if (recipe) {
        showToast('레시피가 삭제되었습니다', {
          label: '실행 취소',
          onClick: () => {
            const restored = addRecipe(recipe)
            if (restored.success) {
              setRecipes(restored.recipes)
              showToast('삭제가 취소되었습니다')
            }
          },
        })
      }
    }
  }

  function handleToggleFavorite(id: string) {
    const recipe = getRecipe(id)
    if (!recipe) return
    const updated = { ...recipe, isFavorite: !recipe.isFavorite, updatedAt: new Date().toISOString() }
    const result = updateRecipe(updated)
    if (result.success) setRecipes(result.recipes)
  }

  function handleDuplicate(source: Recipe) {
    const duped = duplicateRecipe(source)
    setScreen({ type: 'CREATE', sourceRecipe: duped })
  }

  const currentRecipe = screen.type === 'DETAIL' ? getRecipe(screen.recipeId) : null

  return (
    <div className="flex justify-center min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <div
        className="relative w-full max-w-[390px] min-h-screen overflow-hidden"
        style={{ backgroundColor: 'var(--background)', boxShadow: 'var(--shadow-xl)', fontFamily: "'Noto Sans KR', sans-serif" }}
      >
        {screen.type === 'FEED' && (
          <RecipeFeed
            recipes={recipes}
            onSelect={id => setScreen({ type: 'DETAIL', recipeId: id })}
            onCreate={() => setScreen({ type: 'CREATE' })}
            onToggleFavorite={handleToggleFavorite}
            onDataChange={refreshRecipes}
          />
        )}

        {screen.type === 'CREATE' && (
          <CreateRecipe
            source={screen.sourceRecipe}
            isEdit={screen.isEdit}
            allRecipes={recipes}
            onSave={handleSave}
            onCancel={() => setScreen({ type: 'FEED' })}
          />
        )}

        {screen.type === 'DETAIL' && currentRecipe && (
          <RecipeDetail
            recipe={currentRecipe}
            onBack={() => setScreen({ type: 'FEED' })}
            onEdit={() => setScreen({ type: 'CREATE', sourceRecipe: currentRecipe, isEdit: true })}
            onDuplicate={() => handleDuplicate(currentRecipe)}
            onDelete={() => handleDelete(currentRecipe.id)}
            onToggleFavorite={() => handleToggleFavorite(currentRecipe.id)}
          />
        )}

        {screen.type === 'DETAIL' && !currentRecipe && (
          <div className="flex items-center justify-center py-32 text-sm" style={{ color: '#9D174D' }}>
            레시피를 찾을 수 없습니다.
            <button onClick={() => setScreen({ type: 'FEED' })} className="ml-2 underline cursor-pointer" style={{ color: '#EC4899' }}>
              목록으로
            </button>
          </div>
        )}

        <ToastContainer />
      </div>
    </div>
  )
}
