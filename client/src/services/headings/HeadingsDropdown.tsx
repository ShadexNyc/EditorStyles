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

const dropdownStyle = { minWidth: 140 }

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
        className="ribbon-btn"
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
          <ul className="ribbon-dropdown" style={dropdownStyle}>
            {blockTypes.map((type) => (
              <li key={type}>
                <button
                  type="button"
                  className={`ribbon-dropdown-item ${current === type ? 'is-active' : ''}`}
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
