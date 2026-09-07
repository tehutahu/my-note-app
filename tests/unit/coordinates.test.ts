import { describe, expect, it } from 'vitest';
import { toPage, toScreen } from '../../src/domain/coordinates';
describe('INK-03 ページ座標', () => {
  it('CSS領域・パン・倍率を除いてカーソル位置を保存する', () => {
    expect(toPage({ x: 150, y: 290 }, { left: 10, top: 30, panX: 40, panY: 60, zoom: 2 })).toEqual({ x: 50, y: 100 });
  });
  it('4倍率・3DPR・パン有無で1000点ずつ往復して誤差0.1pt以内', () => {
    for (const zoom of [.25, 1, 2, 4]) for (const dpr of [1, 2, 3]) for (const pan of [0, 73]) {
      // DPRは描画buffer専用。CSS座標変換へ混入させない。
      expect(dpr).toBeGreaterThan(0);
      const view = { left: 17, top: 31, panX: pan, panY: -pan, zoom };
      for (let i = 0; i < 1000; i++) {
        const point = { x: ((i * 73) % 59528) / 100, y: ((i * 131) % 84189) / 100 };
        const screen = toScreen(point, view);
        expect(screen.x).toBeCloseTo(17 + pan + point.x * zoom, 8);
        const back = toPage(screen, view);
        expect(Math.abs(back.x - point.x)).toBeLessThanOrEqual(.1);
        expect(Math.abs(back.y - point.y)).toBeLessThanOrEqual(.1);
      }
    }
  });
});
