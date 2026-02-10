import { useSlate } from 'slate-react'
import { useHighlight } from './useHighlight'

const ribbonBtn = {
  padding: 4,
  border: 'none',
  borderRadius: 12,
  background: 'transparent',
  cursor: 'pointer',
  width: 28,
  height: 28,
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export function HighlightPicker() {
  const editor = useSlate()
  const { setHighlight, currentHighlight } = useHighlight(editor)

  const value = currentHighlight.startsWith('rgba')
    ? currentHighlight
    : hexToRgba('#9BCFFF', 0.5)
  const hex = value.startsWith('#') ? value : '#9BCFFF'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHighlight(hexToRgba(e.target.value, 0.5))
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Выделение:</span>
      <input
        type="color"
        value={hex}
        onChange={handleChange}
        onMouseDown={(e) => e.preventDefault()}
        style={ribbonBtn}
        title="Цвет выделения текста"
      />
    </div>
  )
}
