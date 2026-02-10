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
          <ul
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              margin: 0,
              padding: 4,
              listStyle: 'none',
              background: 'var(--color-bg-canvas)',
              border: '1px solid var(--color-border-canvas)',
              borderRadius: 12,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 2,
              minWidth: 70,
            }}
          >
            {sizes.map((size) => (
              <li key={size}>
                <button
                  type="button"
                  style={{
                    ...ribbonBtn,
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    background: currentSize === size ? 'var(--color-ribbon-bg)' : undefined,
                  }}
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
