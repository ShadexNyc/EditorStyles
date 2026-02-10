import { createContext, type ReactNode, useState } from 'react'

export interface ReviewCommentsContextValue {
  fromSidebar: boolean
  setFromSidebar: (v: boolean) => void
  openedSuggestionId: string | null
  setOpenedSuggestionId: (id: string | null) => void
}

export const ReviewCommentsContext = createContext<ReviewCommentsContextValue>({
  fromSidebar: false,
  setFromSidebar: () => {},
  openedSuggestionId: null,
  setOpenedSuggestionId: () => {},
})

export function ReviewCommentsProvider({ children }: { children: ReactNode }) {
  const [fromSidebar, setFromSidebar] = useState(false)
  const [openedSuggestionId, setOpenedSuggestionId] = useState<string | null>(null)
  return (
    <ReviewCommentsContext.Provider
      value={{ fromSidebar, setFromSidebar, openedSuggestionId, setOpenedSuggestionId }}
    >
      {children}
    </ReviewCommentsContext.Provider>
  )
}
