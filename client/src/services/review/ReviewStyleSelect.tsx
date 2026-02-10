import { useReview } from './ReviewContext'

export function ReviewStyleSelect() {
  const { reviewHighlightStyles, currentReviewStyleId, setCurrentReviewStyleId } = useReview()
  return (
    <select
      value={currentReviewStyleId}
      onChange={(e) => setCurrentReviewStyleId(e.target.value)}
      title="Подсветка рецензий"
      style={{
        padding: '4px 8px',
        border: 'none',
        borderRadius: 12,
        background: 'transparent',
        fontSize: 12,
        fontFamily: 'var(--font-family)',
        cursor: 'pointer',
      }}
    >
      {reviewHighlightStyles.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  )
}
