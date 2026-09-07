import { expect, test } from 'vitest';
import { CanvasCache, rasterPlan } from '../../src/pdf/cache';
const canvas = (width: number, height: number) => ({ width, height }) as HTMLCanvasElement;
test('PDF-05 キャッシュは3枚まででLRU順、予算を縮小したヒットも再評価する', () => {
  const cache = new CanvasCache();
  const first = canvas(10, 10), second = canvas(10, 10);
  cache.put('a', first, 1600); cache.put('b', second, 1600); cache.put('c', canvas(10,10), 1600);
  expect(cache.get('a', 1600)).toBe(first);
  cache.put('d', canvas(10,10), 1600);
  expect(cache.count).toBe(3); expect(cache.bytes).toBe(1200); expect(second.width).toBe(0);
  expect(cache.get('a', 300)).toBeUndefined(); expect(cache.bytes).toBeLessThanOrEqual(300); expect(first.width).toBe(0);
});
test('PDF-05 大きすぎるcanvasを保持せずclearで画素バッファを解放する', () => {
  const cache = new CanvasCache(), large = canvas(100,100), small = canvas(10,10);
  cache.put('large', large, 1000); expect(cache.count).toBe(0); expect(large.width).toBe(0);
  cache.put('small', small, 1000); expect(cache.get('small', 1000)).toBe(small);
  cache.clear(); expect(small.height).toBe(0); expect(cache.bytes).toBe(0);
});
test('PDF-05 DPR1/2/3と大画面でも表示canvas3枚を32MiB以内にしPDF用余裕を残す', () => {
  for (const [w,h] of [[1280,800], [3840,2160], [320,740]]) for (const dpr of [1,2,3]) {
    const plan = rasterPlan(w,h,dpr);
    expect(plan.width * plan.height * 4 * 3).toBeLessThanOrEqual(32 * 1024 * 1024);
    expect(plan.scale).toBeLessThanOrEqual(dpr); expect(plan.width).toBeGreaterThan(0);
    expect(Math.abs(plan.width / plan.scale - w)).toBeLessThanOrEqual(1 / plan.scale);
  }
});
