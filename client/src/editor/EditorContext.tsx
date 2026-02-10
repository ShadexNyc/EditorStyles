import { createContext, type ReactNode } from 'react'
import type { ReactEditor } from 'slate-react'

export type EditorContextValue = ReactEditor | null

export const EditorContext = createContext<EditorContextValue>(null)

export function EditorProvider({
  editor,
  children,
}: {
  editor: ReactEditor | null
  children: ReactNode
}) {
  return (
    <EditorContext.Provider value={editor}>
      {children}
    </EditorContext.Provider>
  )
}
