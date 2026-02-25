import type { Descendant } from 'slate'
import type { TableCellElement } from '../types/slate'

const unsplashAviationImageUrl =
  'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1400&q=80'

function createTableCell(text: string): TableCellElement {
  return {
    type: 'table-cell',
    children: [{ text }],
  }
}

export const initialContent: Descendant[] = [
  {
    type: 'paragraph',
    children: [
      {
        text: 'Самолёты остаются символом стремительного технологического развития: за немногим более века авиация прошла путь от первых бипланов до межконтинентальных лайнеров и радикально сократила расстояния между странами. Пассажирские перевозки строятся на сочетании скорости, комфорта и инженерной надёжности, поэтому каждая конструкция — от крыла до силовой установки — проектируется с учётом устойчивости в разных погодных режимах и топливной эффективности.',
      },
    ],
  },
  {
    type: 'paragraph',
    children: [
      {
        text: 'Слаженная работа экипажей и диспетчерских служб поддерживает безопасность полётов, а отрасль параллельно двигается к экологичности: применяются более тихие двигатели, композитные материалы и оптимизированные профили маршрутов, а также исследуются устойчивое авиационное топливо и гибридные схемы. Перед выходом в эксплуатацию новые воздушные суда проходят длительный цикл наземных и лётных проверок, подтверждающих соответствие строгим стандартам.',
      },
    ],
  },
  {
    type: 'image',
    url: unsplashAviationImageUrl,
    alt: 'Фотография пассажирского самолёта с Unsplash',
    children: [{ text: '' }],
  },
  {
    type: 'table',
    children: [
      {
        type: 'table-row',
        children: [
          createTableCell('R1C1: Модель'),
          createTableCell('R1C2: Производитель'),
          createTableCell('R1C3: Вместимость'),
          createTableCell('R1C4: Дальность'),
          createTableCell('R1C5: Крейсерская скорость'),
        ],
      },
      {
        type: 'table-row',
        children: [
          createTableCell('R2C1: Airbus A320neo'),
          createTableCell('R2C2: Airbus'),
          createTableCell('R2C3: 150–180 пасс.'),
          createTableCell('R2C4: до 6 300 км'),
          createTableCell('R2C5: 840 км/ч'),
        ],
      },
      {
        type: 'table-row',
        children: [
          createTableCell('R3C1: Boeing 737 MAX 8'),
          createTableCell('R3C2: Boeing'),
          createTableCell('R3C3: 162–178 пасс.'),
          createTableCell('R3C4: до 6 570 км'),
          createTableCell('R3C5: 842 км/ч'),
        ],
      },
      {
        type: 'table-row',
        children: [
          createTableCell('R4C1: Embraer E195-E2'),
          createTableCell('R4C2: Embraer'),
          createTableCell('R4C3: 120–146 пасс.'),
          createTableCell('R4C4: до 4 815 км'),
          createTableCell('R4C5: 870 км/ч'),
        ],
      },
      {
        type: 'table-row',
        children: [
          createTableCell('R5C1: Sukhoi Superjet 100'),
          createTableCell('R5C2: Яковлев (ГСС)'),
          createTableCell('R5C3: 87–108 пасс.'),
          createTableCell('R5C4: до 4 578 км'),
          createTableCell('R5C5: 830 км/ч'),
        ],
      },
    ],
  },
]
