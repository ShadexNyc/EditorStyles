import { useSlate, ReactEditor } from 'slate-react'
import { Range, Transforms } from 'slate'
import { useRef } from 'react'
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

const modeBtn = {
  ...ribbonBtn,
  padding: '4px 8px',
  fontSize: 11,
  border: '1px solid #d5d5d5',
}

const modeBtnActive = {
  ...modeBtn,
  background: '#1f6feb',
  color: '#fff',
  border: '1px solid #1f6feb',
}

export function ReviewToggle() {
  const { reviewMode, setReviewMode, reviewEditMode, setReviewEditMode } = useReview()
  const editor = useSlate()
  const savedSelectionRef = useRef<Range | null>(null)

  const handleMouseDown = (_e: React.MouseEvent) => {
    if (!reviewMode && editor.selection && !Range.isCollapsed(editor.selection)) {
      savedSelectionRef.current = editor.selection
    } else {
      savedSelectionRef.current = null
    }
  }

  const handleClick = () => {
    const newReviewMode = !reviewMode
    setReviewMode(newReviewMode)

    if (newReviewMode && savedSelectionRef.current) {
      const savedSelection = savedSelectionRef.current
      requestAnimationFrame(() => {
        try {
          Transforms.select(editor, savedSelection)
          ReactEditor.focus(editor as ReactEditor)
        } catch (error) {
          console.debug('Could not restore selection:', error)
        }
        savedSelectionRef.current = null
      })
    }
  }

  return (
    <button
      type="button"
      style={reviewMode ? activeBtn : ribbonBtn}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      title="Режим рецензирования"
    >
      Рецензирование
    </button>
  )
}
