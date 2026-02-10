import { useCallback, useContext } from 'react'
import { useSlate } from 'slate-react'
import { acceptSuggestion, getSuggestionsList, rejectSuggestion } from '../../editor/commitReview'
import { DocumentContext } from '../../storage/DocumentContext'
import { getInitials } from '../users/users'
import { useReview } from './ReviewContext'
import { ReviewCommentsContext } from './ReviewCommentsContext'

function renderAction(deletionText: string, insertionText: string) {
  const hasDel = deletionText.length > 0
  const hasIns = insertionText.length > 0
  if (hasDel && hasIns) {
    return (
      <>
        <div className="review-comments-action-line review-comments-action-line-first">
          <span className="review-comments-action-label">Заменить:</span> {deletionText}
        </div>
        <div className="review-comments-action-line review-comments-action-line-second">
          <span className="review-comments-action-label">на</span> {insertionText}
        </div>
      </>
    )
  }
  if (hasDel) return `Удалить: ${deletionText}`
  if (hasIns) return `Добавить: ${insertionText}`
  return 'Правка'
}

export function ReviewCommentsSidebar() {
  const editor = useSlate()
  const { users } = useContext(DocumentContext)
  const { setFromSidebar, setOpenedSuggestionId, openedSuggestionId, setAcceptHoverSuggestionId } =
    useContext(ReviewCommentsContext)
  const { reviewMode } = useReview()

  const suggestions = getSuggestionsList(editor)

  const openBubble = useCallback(
    (id: string) => {
      setFromSidebar(true)
      setOpenedSuggestionId(id)
    },
    [setFromSidebar, setOpenedSuggestionId]
  )

  const handleAccept = useCallback(
    (e: React.MouseEvent, suggestionId: string) => {
      e.stopPropagation()
      setAcceptHoverSuggestionId(null)
      acceptSuggestion(editor, suggestionId)
    },
    [editor, setAcceptHoverSuggestionId]
  )

  const handleReject = useCallback(
    (e: React.MouseEvent, suggestionId: string) => {
      e.stopPropagation()
      rejectSuggestion(editor, suggestionId)
    },
    [editor]
  )

  if (!reviewMode) return null

  return (
    <aside className="review-comments-sidebar">
      <div className="review-comments-sidebar-inner">
        {suggestions.length > 0 &&
          suggestions.map((s) => {
            const authorName = s.authorId
              ? users.find((u) => u.id === s.authorId)?.name ?? 'Автор'
              : 'Автор'
            const isOpen = openedSuggestionId === s.id
            return (
              <div key={s.id} className="review-comments-bubble-wrap">
                <div className={`review-comments-bubble ${isOpen ? 'is-open' : ''}`}>
                  <div className="review-comments-bubble-header-row">
                    <button
                      type="button"
                      className="review-comments-bubble-header"
                      onClick={() => openBubble(s.id)}
                      aria-expanded={isOpen}
                    >
                      <div
                        className="review-comments-avatar"
                        style={{ background: s.authorColor }}
                        aria-hidden
                      >
                        {getInitials(authorName)}
                      </div>
                      <div className="review-comments-bubble-content">
                        <div className="review-comments-author">{authorName}</div>
                        <div className="review-comments-action">
                          {renderAction(s.deletionText, s.insertionText)}
                        </div>
                      </div>
                    </button>
                    <div className="review-comments-bubble-actions" aria-hidden>
                      <button
                        type="button"
                        className="review-comments-toolbar-btn"
                        onClick={(e) => handleAccept(e, s.id)}
                        onMouseEnter={() => setAcceptHoverSuggestionId(s.id)}
                        onMouseLeave={() => setAcceptHoverSuggestionId(null)}
                        aria-label="Принять рецензию"
                        title="Принять рецензию"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="review-comments-toolbar-btn"
                        onClick={(e) => handleReject(e, s.id)}
                        aria-label="Отклонить рецензию"
                        title="Отклонить рецензию"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="review-comments-card">
                      <input
                        type="text"
                        className="review-comments-input"
                        placeholder="оставить комментарий"
                        aria-label="Комментарий к рецензии"
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
      </div>
    </aside>
  )
}
