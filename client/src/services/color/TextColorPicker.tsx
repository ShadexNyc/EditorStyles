import { useSlate } from 'slate-react'
import { useTextColor } from './useTextColor'

const ribbonBtn = {
  padding: 4,
  border: 'none',
  borderRadius: 12,
  background: 'transparent',
  cursor: 'pointer',
  width: 28,
  height: 28,
}

export function TextColorPicker() {
  const editor = useSlate()
  const { setColor, currentColor } = useTextColor(editor)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Цвет:</span>
      <input
        type="color"
        value={currentColor}
        onChange={(e) => setColor(e.target.value)}
        onMouseDown={(e) => e.preventDefault()}
        style={ribbonBtn}
        title="Цвет текста"
      />
    </div>
  )
}
