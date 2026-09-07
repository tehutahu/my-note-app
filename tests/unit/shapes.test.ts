import { expect, it } from 'vitest';
import { hitsShape, type Shape } from '../../src/domain/shapes';
const shape = (kind: Shape['kind']): Shape => ({ id: 's', type: 'shape', kind, x1: 10, y1: 20, x2: 110, y2: 100, color: '#123456', widthPt: 3 });
it('NOTE-03/INK-04 直線・長方形・楕円の輪郭を消し中心は消さない', () => {
  expect(hitsShape(shape('line'), { x: 60, y: 60 }, 1)).toBe(true);
  expect(hitsShape(shape('line'), { x: 60, y: 10 }, 1)).toBe(false);
  for (const kind of ['rectangle', 'ellipse'] as const) {
    expect(hitsShape(shape(kind), { x: 110, y: 60 }, 1)).toBe(true);
    expect(hitsShape(shape(kind), { x: 60, y: 60 }, 1)).toBe(false);
    expect(hitsShape({ ...shape(kind), x1: 110, x2: 10 }, { x: 110, y: 60 }, 1)).toBe(true);
  }
});
it('NOTE-03 幅や高さが0の楕円も線または点として消せる', () => {
  expect(hitsShape({ ...shape('ellipse'), x2: 10 }, { x: 10, y: 60 }, 1)).toBe(true);
  expect(hitsShape({ ...shape('ellipse'), x2: 10, y2: 20 }, { x: 10, y: 20 }, 1)).toBe(true);
});
