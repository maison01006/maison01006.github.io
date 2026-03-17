export type ProductType = 'CREAM' | 'GEL' | 'LIQUID' | 'POWDER'
export type PhotoType = 'BEFORE' | 'AFTER' | 'REFERENCE'
export type HairThickness = 'THIN' | 'NORMAL' | 'THICK'

export interface ZoneProduct {
  id: string
  brandName: string
  shadeCode: string
  productType: ProductType
  ratio: number
  amountGram?: number
  isOxidizer: boolean
  oxidizerVolume?: 10 | 20 | 30 | 40
}

export interface Zone {
  id: string
  zoneName: string
  applicationOrder: number
  processingTime: number
  products: ZoneProduct[]
}

export interface HairState {
  damageLevel: 1 | 2 | 3 | 4 | 5
  currentLevel?: number
  naturalLevel?: number
  grayPercentage?: number
  hairThickness?: HairThickness
  bleachCount?: number
  previousColor?: string
}

export interface Photo {
  id: string
  dataUrl: string
  photoType: PhotoType
  sortOrder: number
}

export interface Recipe {
  id: string
  clientName?: string
  treatmentDate: string
  treatmentTags: string[]
  heatTreatment: boolean
  preTreatmentTags: string[]
  postTreatmentTags: string[]
  memo?: string
  sourceRecipeId?: string
  hairState: HairState
  zones: Zone[]
  photos: Photo[]
  createdAt: string
  updatedAt: string
}

export type Screen =
  | { type: 'FEED' }
  | { type: 'CREATE'; sourceRecipe?: Recipe }
  | { type: 'DETAIL'; recipeId: string }
