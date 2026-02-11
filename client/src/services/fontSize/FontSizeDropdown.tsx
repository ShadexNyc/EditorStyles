import { useState } from 'react'
import { useSlate } from 'slate-react'
import { useFontSize } from './useFontSize'

const ribbonBtn = {
  padding: '6px 10px',
  border: 'none',
  borderRadius: 12,
  background: 'transparent',
  cursor: 'pointer',
  fontSize: 12,
  fontFamily: 'var(--font-family)',
  minWidth: 48,
}

const dropdownStyle = { minWidth: 70 }

export function FontSizeDropdown() {
  const editor = useSlate()
  const { setSize, currentSize, sizes } = useFontSize(editor)
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        style={ribbonBtn}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
        title="Размер шрифта"
      >
        {currentSize}
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 1 }} onClick={() => setOpen(false)} aria-hidden />
          <ul className="ribbon-dropdown" style={dropdownStyle}>
            {sizes.map((size) => (
              <li key={size}>
                <button
                  type="button"
                  className={`ribbon-dropdown-item ${currentSize === size ? 'is-active' : ''}`}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    setSize(size)
                    setOpen(false)
                  }}
                >
                  {size}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
