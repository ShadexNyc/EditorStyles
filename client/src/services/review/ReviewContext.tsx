import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

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
  { id: 'style-8', name: 'Стиль 8' },
  { id: 'style-9', name: 'Стиль 9' },
]

export interface ReviewContextValue {
  reviewMode: boolean
  setReviewMode: (value: boolean) => void
  reviewHighlightStyles: ReviewHighlightStyle[]
  currentReviewStyleId: string
  setCurrentReviewStyleId: (id: string) => void
}

const DEFAULT_REVIEW_STYLE_ID = 'style-1'

function resolveReviewStyleIdFromPath(pathname: string): string {
  const match = pathname.match(/\/(\d+)\/?$/)
  if (!match) {
    return DEFAULT_REVIEW_STYLE_ID
  }

  const styleId = `style-${match[1]}`
  return REVIEW_HIGHLIGHT_STYLES.some((style) => style.id === styleId)
    ? styleId
    : DEFAULT_REVIEW_STYLE_ID
}

function getReviewStyleIdFromUrl(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_REVIEW_STYLE_ID
  }

  return resolveReviewStyleIdFromPath(window.location.pathname)
}

function getUrlPathByStyleId(styleId: string): string {
  if (typeof window === 'undefined') {
    return '/'
  }

  const styleNumber = styleId.replace('style-', '')
  const normalizedPath = window.location.pathname.replace(/\/(\d+)\/?$/, '')
  const basePath = normalizedPath === '' ? '/' : normalizedPath
  const trailingSlashBase = basePath.endsWith('/') ? basePath : `${basePath}/`
  return `${trailingSlashBase}${styleNumber}`
}

export const ReviewContext = createContext<ReviewContextValue>({
  reviewMode: false,
  setReviewMode: () => {},
  reviewHighlightStyles: REVIEW_HIGHLIGHT_STYLES,
  currentReviewStyleId: DEFAULT_REVIEW_STYLE_ID,
  setCurrentReviewStyleId: () => {},
})

export function ReviewProvider({ children }: { children: ReactNode }) {
  const [reviewMode, setReviewMode] = useState(false)
  const [currentReviewStyleId, setCurrentReviewStyleId] = useState(getReviewStyleIdFromUrl)

  useEffect(() => {
    const nextPath = getUrlPathByStyleId(currentReviewStyleId)
    const nextUrl = `${nextPath}${window.location.search}${window.location.hash}`
    if (nextPath !== window.location.pathname) {
      window.history.replaceState(window.history.state, '', nextUrl)
    }
  }, [currentReviewStyleId])

  useEffect(() => {
    const syncStyleFromUrl = () => {
      setCurrentReviewStyleId(resolveReviewStyleIdFromPath(window.location.pathname))
    }

    window.addEventListener('popstate', syncStyleFromUrl)
    return () => window.removeEventListener('popstate', syncStyleFromUrl)
  }, [])

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
