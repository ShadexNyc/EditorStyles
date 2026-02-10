import { useState } from 'react'
import { useSlate } from 'slate-react'
import { useHeadings } from './useHeadings'

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

const labels: Record<string, string> = {
  paragraph: 'Обычный',
  h1: 'Заголовок 1',
  h2: 'Заголовок 2',
  h3: 'Заголовок 3',
  h4: 'Заголовок 4',
  h5: 'Заголовок 5',
  h6: 'Заголовок 6',
}

export function HeadingsDropdown() {
  const editor = useSlate()
  const { setBlockType, getBlockType, blockTypes } = useHeadings(editor)
  const [open, setOpen] = useState(false)
  const current = getBlockType()

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        style={ribbonBtn}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
        title="Стиль абзаца"
      >
        {labels[current] ?? current}
      </button>
      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 1 }}
            onClick={() => setOpen(false)}
            aria-hidden
          />
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
              minWidth: 140,
            }}
          >
            {blockTypes.map((type) => (
              <li key={type}>
                <button
                  type="button"
                  style={{
                    ...ribbonBtn,
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    background: current === type ? 'var(--color-ribbon-bg)' : undefined,
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    setBlockType(type)
                    setOpen(false)
                  }}
                >
                  {labels[type]}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
