import type { ReactNode } from 'react'

interface CanvasProps {
  children: ReactNode
}

export function Canvas({ children }: CanvasProps) {
  return (
    <div className="canvas-wrapper">
      <section className="task-block" aria-label="Задание">
        <p className="task-block-title">Задание:</p>
        <ol className="task-block-list">
          <li>Включите в онлайн редакторе режим "Предложения изменений".</li>
          <li>Найдите в тексте утверждение "Они развивают мышление и расширяют кругозор" и предложите свой вариант изменения.</li>
        </ol>
      </section>
      <div className="canvas-a4">
        {children}
      </div>
    </div>
  )
}
