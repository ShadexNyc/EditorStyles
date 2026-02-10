import { useReview } from './ReviewContext'

const ribbonBtn = {
  padding: '6px 10px',
  border: 'none',
  borderRadius: 12,
  background: 'transparent',
  cursor: 'pointer',
  fontSize: 12,
  fontFamily: 'var(--font-family)',
}
const activeBtn = {
  ...ribbonBtn,
  background: 'var(--color-accent)',
  color: '#fff',
}

export function ReviewToggle() {
  const { reviewMode, setReviewMode } = useReview()
  return (
    <button
      type="button"
      style={reviewMode ? activeBtn : ribbonBtn}
      onClick={() => setReviewMode(!reviewMode)}
      title="Режим рецензирования: выделите текст и введите правку"
    >
      Рецензирование
    </button>
  )
}
