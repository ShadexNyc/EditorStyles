import { useState } from 'react'
import { useReview } from './ReviewContext'

const ribbonBtn = {
  padding: '6px 10px',
  border: 'none',
  borderRadius: 12,
  background: 'transparent',
  cursor: 'pointer',
  fontSize: 12,
  fontFamily: 'var(--font-family)',
  minWidth: 80,
}

export function ReviewStyleSelect() {
  const { reviewHighlightStyles, currentReviewStyleId, setCurrentReviewStyleId } = useReview()
  const [open, setOpen] = useState(false)
  const currentName = reviewHighlightStyles.find((s) => s.id === currentReviewStyleId)?.name ?? currentReviewStyleId

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        style={ribbonBtn}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
        title="Подсветка рецензий"
      >
        {currentName}
      </button>
      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 1 }}
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <ul className="ribbon-dropdown" style={{ minWidth: 120 }}>
            {reviewHighlightStyles.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={`ribbon-dropdown-item ${currentReviewStyleId === s.id ? 'is-active' : ''}`}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    setCurrentReviewStyleId(s.id)
                    setOpen(false)
                  }}
                >
                  {s.name}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
