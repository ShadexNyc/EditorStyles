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
]

export interface ReviewContextValue {
  reviewMode: boolean
  setReviewMode: (value: boolean) => void
  reviewHighlightStyles: ReviewHighlightStyle[]
  currentReviewStyleId: string
  setCurrentReviewStyleId: (id: string) => void
}

export const ReviewContext = createContext<ReviewContextValue>({
  reviewMode: false,
  setReviewMode: () => {},
  reviewHighlightStyles: REVIEW_HIGHLIGHT_STYLES,
  currentReviewStyleId: 'style-1',
  setCurrentReviewStyleId: () => {},
})

export function ReviewProvider({ children }: { children: ReactNode }) {
  const [reviewMode, setReviewMode] = useState(false)
  const [currentReviewStyleId, setCurrentReviewStyleId] = useState('style-1')
  return (
    <ReviewContext.Provider
      value={{
        reviewMode,
        setReviewMode,
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
  getCurrentUserId: () => string | undefined
  getUserColor: (userId: string) => string
}

export function useReview() {
  return useContext(ReviewContext)
}
