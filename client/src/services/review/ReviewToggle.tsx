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

export function ReviewToggle() {
  const { reviewMode, setReviewMode } = useReview()
  const editor = useSlate()
  const savedSelectionRef = useRef<Range | null>(null)

  const handleMouseDown = (_e: React.MouseEvent) => {
    // Сохраняем выделение до того, как клик на кнопке приведёт к его потере
    if (!reviewMode && editor.selection && !Range.isCollapsed(editor.selection)) {
      savedSelectionRef.current = editor.selection
    } else {
      savedSelectionRef.current = null
    }
  }

  const handleClick = () => {
    const newReviewMode = !reviewMode
    setReviewMode(newReviewMode)

    // Если включаем режим рецензирования и было сохранено выделение текста,
    // восстанавливаем его и фокусируем редактор, чтобы пользователь мог сразу начать печатать
    if (newReviewMode && savedSelectionRef.current) {
      const savedSelection = savedSelectionRef.current
      
      // Используем requestAnimationFrame для восстановления выделения и фокуса после обновления состояния
      requestAnimationFrame(() => {
        // Восстанавливаем выделение
        try {
          Transforms.select(editor, savedSelection)
          // Фокусируем редактор через ReactEditor API
          ReactEditor.focus(editor as ReactEditor)
        } catch (error) {
          // Если выделение стало невалидным (например, текст был удалён), игнорируем ошибку
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
      title="Режим рецензирования: выделите текст и введите правку"
    >
      Рецензирование
    </button>
  )
}
