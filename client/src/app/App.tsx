import { useEffect, useMemo, useRef } from 'react'
import { Slate } from 'slate-react'
import { Ribbon } from '../components/Ribbon'
import { UserSwitcher } from '../services/users/UserSwitcher'
import { Canvas } from '../editor/Canvas'
import { createSlateEditor } from '../editor/createEditor'
import { commitActiveSuggestions } from '../editor/commitReview'
import { initialContent } from '../editor/initialContent'
import { SlateEditorBody } from '../editor/SlateEditor'
import { useReview } from '../services/review/ReviewContext'
import { ReviewCommentsProvider } from '../services/review/ReviewCommentsContext'
import { ReviewCommentsSidebar } from '../services/review/ReviewCommentsSidebar'
import { DocumentProvider } from '../storage/DocumentContext'
import { DEFAULT_DOCUMENT_ID } from '../storage/db'
import { useDocumentStorage } from '../storage/useDocumentStorage'

function App() {
  const {
    loaded,
    initialValue,
    handleContentChange,
    currentUserId,
    setCurrentUserId,
    users,
    addUser,
  } = useDocumentStorage(initialContent)
  const { reviewMode } = useReview()
  const reviewPluginRef = useRef<import('../services/review/ReviewContext').ReviewPluginRef | null>(null)
  reviewPluginRef.current = {
    getReviewMode: () => reviewMode,
    getCurrentUserId: () => currentUserId,
    getUserColor: (id: string) => users.find((u) => u.id === id)?.color ?? '#666',
  }
  const editor = useMemo(() => createSlateEditor(reviewPluginRef), [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault()
        addUser()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [addUser])

  if (!loaded) {
    return (
      <div className="app" style={{ justifyContent: 'center', alignItems: 'center' }}>
        Загрузка...
      </div>
    )
  }

  return (
    <Slate
      key={DEFAULT_DOCUMENT_ID}
      editor={editor}
      initialValue={initialValue}
      onChange={handleContentChange}
      onSelectionChange={() => commitActiveSuggestions(editor)}
    >
      <DocumentProvider
        currentUserId={currentUserId}
        setCurrentUserId={setCurrentUserId}
        users={users}
        addUser={addUser}
      >
        <ReviewCommentsProvider>
          <div className="app">
            <header className="app-header">
              <div className="app-header-title">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="#5ba3d0" stroke="#4a8fbc" strokeWidth="1.2"/>
                  <path d="M14 2v6h6M12 18v-4M10 14h4" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                <span>Редактор А4</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <UserSwitcher />
              </div>
            </header>
            <Ribbon />
            <main className="app-main">
              <Canvas>
                <SlateEditorBody />
              </Canvas>
              <ReviewCommentsSidebar />
            </main>
          </div>
        </ReviewCommentsProvider>
      </DocumentProvider>
    </Slate>
  )
}

export default App
