import { useCallback, useContext } from 'react'
import { useSlate } from 'slate-react'
import { getSuggestionsList } from '../../editor/commitReview'
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
        <span className="review-comments-action-label">Заменить:</span> [{deletionText}]{' '}
        <span className="review-comments-action-label">на</span> [{insertionText}]
      </>
    )
  }
  if (hasDel) return `Удалить: [${deletionText}]`
  if (hasIns) return `Добавить: [${insertionText}]`
  return 'Правка'
}

export function ReviewCommentsSidebar() {
  const editor = useSlate()
  const { users } = useContext(DocumentContext)
  const { setFromSidebar, setOpenedSuggestionId, openedSuggestionId } = useContext(
    ReviewCommentsContext
  )
  const { reviewMode } = useReview()

  const suggestions = getSuggestionsList(editor)

  const openBubble = useCallback(
    (id: string) => {
      setFromSidebar(true)
      setOpenedSuggestionId(id)
    },
    [setFromSidebar, setOpenedSuggestionId]
  )

  if (!reviewMode) return null

  return (
    <aside className="review-comments-sidebar">
      <div className="review-comments-sidebar-inner">
        {suggestions.length === 0 ? (
          <p className="review-comments-empty">Нет рецензий</p>
        ) : (
          suggestions.map((s) => {
            const authorName = s.authorId
              ? users.find((u) => u.id === s.authorId)?.name ?? 'Автор'
              : 'Автор'
            const isOpen = openedSuggestionId === s.id
            return (
              <div key={s.id} className="review-comments-bubble-wrap">
                <button
                  type="button"
                  className={`review-comments-bubble ${isOpen ? 'is-open' : ''}`}
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
            )
          })
        )}
      </div>
    </aside>
  )
}
