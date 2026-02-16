import { createContext, useContext, useState, type ReactNode } from 'react'

export interface ReviewHighlightStyle {
  id: string
  name: string
}

export const REVIEW_HIGHLIGHT_STYLES: ReviewHighlightStyle[] = [
  { id: 'style-1', name: 'Стиль 1' },
  { id: 'style-2', name: 'Стиль 2' },
  { id: 'style-3', name: 'Стиль 3' },
  { id: 'style-4', name: 'Стиль 4' },
  { id: 'style-5', name: 'Стиль 5' },
  { id: 'style-6', name: 'Стиль 6' },
  { id: 'style-7', name: 'Стиль 7' },
  { id: 'style-9', name: 'Стиль 9' },
]

export interface ReviewContextValue {
  reviewMode: boolean
  setReviewMode: (value: boolean) => void
  /**
   * Backward-compatible API: review now runs in a single mode,
   * but older integrations may still read this field.
   */
  reviewEditMode: ReviewEditMode
  setReviewEditMode: (value: ReviewEditMode) => void
  reviewHighlightStyles: ReviewHighlightStyle[]
  currentReviewStyleId: string
  setCurrentReviewStyleId: (id: string) => void
}

export type ReviewEditMode = 'replace' | 'delete' | 'insert'

const DEFAULT_REVIEW_EDIT_MODE: ReviewEditMode = 'replace'

export const ReviewContext = createContext<ReviewContextValue>({
  reviewMode: false,
  setReviewMode: () => {},
  reviewEditMode: DEFAULT_REVIEW_EDIT_MODE,
  setReviewEditMode: () => {},
  reviewHighlightStyles: REVIEW_HIGHLIGHT_STYLES,
  currentReviewStyleId: 'style-1',
  setCurrentReviewStyleId: () => {},
})

export function ReviewProvider({ children }: { children: ReactNode }) {
  const [reviewMode, setReviewMode] = useState(false)
  const [reviewEditMode, setReviewEditMode] = useState<ReviewEditMode>(DEFAULT_REVIEW_EDIT_MODE)
  const [currentReviewStyleId, setCurrentReviewStyleId] = useState('style-1')
  return (
    <ReviewContext.Provider
      value={{
        reviewMode,
        setReviewMode,
        reviewEditMode,
        setReviewEditMode,
        reviewHighlightStyles: REVIEW_HIGHLIGHT_STYLES,
        currentReviewStyleId,
        setCurrentReviewStyleId,
      }}
    >
      {children}
    </ReviewContext.Provider>
  )
}

export interface ReviewPluginRef {
  getReviewMode: () => boolean
  getReviewEditMode?: () => ReviewEditMode
  getCurrentUserId: () => string | undefined
  getUserColor: (userId: string) => string
}

export function useReview() {
  return useContext(ReviewContext)
}
