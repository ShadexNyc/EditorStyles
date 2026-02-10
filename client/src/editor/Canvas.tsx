import type { ReactNode } from 'react'

interface CanvasProps {
  children: ReactNode
}

export function Canvas({ children }: CanvasProps) {
  return (
    <div className="canvas-wrapper">
      <div className="canvas-a4">
        {children}
      </div>
    </div>
  )
}
