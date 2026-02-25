import { useCallback, useContext, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSlate } from 'slate-react'
import { Editor, Element as SlateElement } from 'slate'
import { acceptSuggestion, getSuggestionsList, rejectSuggestion } from '../../editor/commitReview'
import { DocumentContext } from '../../storage/DocumentContext'
import type { ImageElement } from '../../types/slate'
import { getInitials } from '../users/users'
import { ReviewCommentsContext } from './ReviewCommentsContext'

function CommentToolbarButton({
  tooltip,
  ariaLabel,
  onClick,
  onMouseEnter,
  onMouseLeave,
  iconAccept,
  iconReject,
}: {
  tooltip: string
  ariaLabel: string
  onClick: (e: React.MouseEvent) => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  iconAccept?: boolean
  iconReject?: boolean
}) {
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({})
  const wrapperRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!tooltipVisible || !wrapperRef.current) return
    const rect = wrapperRef.current.getBoundingClientRect()
    setTooltipStyle({
      position: 'fixed',
      top: rect.bottom + 6,
      left: rect.left + rect.width / 2,
      transform: 'translateX(-50%)',
    })
  }, [tooltipVisible])

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="review-comments-toolbar-btn"
        onClick={onClick}
        onMouseEnter={() => {
          setTooltipVisible(true)
          onMouseEnter?.()
        }}
        onMouseLeave={() => {
          setTooltipVisible(false)
          onMouseLeave?.()
        }}
        aria-label={ariaLabel}
        title={tooltip}
      >
        {iconAccept && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
        {iconReject && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        )}
      </button>
      {tooltipVisible &&
        createPortal(
          <span className="review-toolbar-tooltip review-comments-tooltip" role="tooltip" style={tooltipStyle}>
            {tooltip}
          </span>,
          document.body
        )}
    </div>
  )
}

function renderAction(deletionText: string, insertionText: string) {
  const hasDel = deletionText.length > 0
  const hasIns = insertionText.length > 0
  if (hasDel && hasIns) {
    return (
      <>
        <div className="review-comments-action-line review-comments-action-line-first">
          <span className="review-comments-action-label">Заменить:</span> {deletionText}
        </div>
        <div className="review-comments-action-divider" aria-hidden />
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

  const suggestions = getSuggestionsList(editor)

  const imageReviewMessages: Array<{
    key: string
    authorName: string
    authorColor: string
    action: string
    comment: string
    changedAt: number
  }> = []

  for (const [node, path] of Editor.nodes(editor, {
    at: [],
    match: (n) => SlateElement.isElement(n) && n.type === 'image',
  })) {
    const imageNode = node as ImageElement
    if (imageNode.reviewChangeType == null) continue
    const authorName = imageNode.reviewAuthorId
      ? users.find((u) => u.id === imageNode.reviewAuthorId)?.name ?? 'Автор'
      : 'Автор'
    const action = imageNode.reviewChangeType === 'deleted' ? 'Удалено изображение' : 'Изменён размер изображения'
    imageReviewMessages.push({
      key: `${path.join('.')}-${imageNode.reviewChangeAt ?? 0}`,
      authorName,
      authorColor: imageNode.reviewAuthorColor ?? '#64748b',
      action,
      comment: imageNode.reviewComment ?? 'Комментарий: действие с изображением выполнено',
      changedAt: imageNode.reviewChangeAt ?? 0,
    })
  }

  imageReviewMessages.sort((a, b) => b.changedAt - a.changedAt)

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
                      </div>
                    </button>
                    <div className="review-comments-bubble-actions" aria-hidden>
                      <CommentToolbarButton
                        tooltip="Принять правку"
                        onClick={(e) => handleAccept(e, s.id)}
                        onMouseEnter={() => setAcceptHoverSuggestionId(s.id)}
                        onMouseLeave={() => setAcceptHoverSuggestionId(null)}
                        ariaLabel="Принять правку"
                        iconAccept
                      />
                      <CommentToolbarButton
                        tooltip="Отменить"
                        onClick={(e) => handleReject(e, s.id)}
                        ariaLabel="Отменить"
                        iconReject
                      />
                    </div>
                  </div>
                  <div className="review-comments-action">
                    {renderAction(s.deletionText, s.insertionText)}
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

        {imageReviewMessages.map((message) => (
          <div key={message.key} className="review-comments-bubble-wrap">
            <div className="review-comments-bubble is-image-event">
              <div className="review-comments-bubble-header-row">
                <div className="review-comments-bubble-header" aria-hidden>
                  <div className="review-comments-avatar" style={{ background: message.authorColor }}>
                    {getInitials(message.authorName)}
                  </div>
                  <div className="review-comments-bubble-content">
                    <div className="review-comments-author">{message.authorName}</div>
                  </div>
                </div>
              </div>
              <div className="review-comments-action">{message.action}</div>
              <div className="review-comments-card">
                <input
                  type="text"
                  className="review-comments-input"
                  defaultValue={message.comment}
                  aria-label="Комментарий к действию с изображением"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
