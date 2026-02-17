import { useSlate } from 'slate-react'
import { useFormatting } from './useFormatting'

const ribbonBtn = {
  padding: '6px 10px',
  border: 'none',
  borderRadius: 12,
  background: 'transparent',
  cursor: 'pointer',
  fontSize: 12,
  fontFamily: 'var(--font-family)',
}
const activeBtn = { ...ribbonBtn, background: 'var(--color-accent)', color: '#fff' }

export function FormattingButtons() {
  const editor = useSlate()
  const { toggleBold, toggleItalic, toggleUnderline, isBold, isItalic, isUnderline } = useFormatting(editor)

  return (
    <>
      <button
        type="button"
        className={`ribbon-btn ${isBold ? 'is-active' : ''}`.trim()}
        style={isBold ? activeBtn : ribbonBtn}
        onMouseDown={(e) => { e.preventDefault(); toggleBold(); }}
        title="Жирный"
      >
        <b>Ж</b>
      </button>
      <button
        type="button"
        className={`ribbon-btn ${isItalic ? 'is-active' : ''}`.trim()}
        style={isItalic ? activeBtn : ribbonBtn}
        onMouseDown={(e) => { e.preventDefault(); toggleItalic(); }}
        title="Курсив"
      >
        <i>К</i>
      </button>
      <button
        type="button"
        className={`ribbon-btn ${isUnderline ? 'is-active' : ''}`.trim()}
        style={isUnderline ? activeBtn : ribbonBtn}
        onMouseDown={(e) => { e.preventDefault(); toggleUnderline(); }}
        title="Подчёркивание"
      >
        <u>Ч</u>
      </button>
    </>
  )
}
