import { createContext, type ReactNode, useState } from 'react'

export interface ReviewCommentsContextValue {
  fromSidebar: boolean
  setFromSidebar: (v: boolean) => void
  openedSuggestionId: string | null
  setOpenedSuggestionId: (id: string | null) => void
  /** ID рецензии, над кнопкой «Принять» которой наведён курсор (для зелёной подсветки в документе) */
  acceptHoverSuggestionId: string | null
  setAcceptHoverSuggestionId: (id: string | null) => void
  acceptHoverImagePathKey: string | null
  setAcceptHoverImagePathKey: (pathKey: string | null) => void
}

export const ReviewCommentsContext = createContext<ReviewCommentsContextValue>({
  fromSidebar: false,
  setFromSidebar: () => {},
  openedSuggestionId: null,
  setOpenedSuggestionId: () => {},
  acceptHoverSuggestionId: null,
  setAcceptHoverSuggestionId: () => {},
  acceptHoverImagePathKey: null,
  setAcceptHoverImagePathKey: () => {},
})

export function ReviewCommentsProvider({ children }: { children: ReactNode }) {
  const [fromSidebar, setFromSidebar] = useState(false)
  const [openedSuggestionId, setOpenedSuggestionId] = useState<string | null>(null)
  const [acceptHoverSuggestionId, setAcceptHoverSuggestionId] = useState<string | null>(null)
  const [acceptHoverImagePathKey, setAcceptHoverImagePathKey] = useState<string | null>(null)
  return (
    <ReviewCommentsContext.Provider
      value={{
        fromSidebar,
        setFromSidebar,
        openedSuggestionId,
        setOpenedSuggestionId,
        acceptHoverSuggestionId,
        setAcceptHoverSuggestionId,
        acceptHoverImagePathKey,
        setAcceptHoverImagePathKey,
      }}
    >
      {children}
    </ReviewCommentsContext.Provider>
  )
}
