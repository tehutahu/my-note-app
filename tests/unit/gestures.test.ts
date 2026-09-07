import { expect, it } from 'vitest';
import { Gestures } from '../../src/input/gestures';
const touch = (id: number, x: number, y = 0) => ({ id, kind: 'touch', x, y });
const pen = (id: number, x = 0) => ({ id, kind: 'pen', x, y: 0 });
it('INK-02 既定の指は移動のみ、ペンが来たら優先し描画中の指を無視', () => {
  const g = new Gestures();
  expect(g.down(touch(1, 10), false, false)).toBe('ignore');
  g.move(touch(1, 20)); expect(g.camera.x).toBe(10);
  expect(g.down(pen(2), false, false)).toBe('draw');
  g.down(touch(3, 100), false, false); g.move(touch(3, 200));
  expect(g.camera).toEqual({ x: 10, y: 0, zoom: 1 });
  expect(g.owner).toBe(2);
});
it('INK-02/05 指書きの2本目で線を破棄し中心を保ってピンチ', () => {
  const g = new Gestures();
  expect(g.down(touch(1, 0), true, false)).toBe('draw');
  expect(g.down(touch(2, 100), true, false)).toBe('cancel');
  g.move(touch(2, 200));
  expect(g.mode).toBe('pinching');
  expect(g.camera).toEqual({ x: 0, y: 0, zoom: 2 });
  g.up(2); g.move(touch(1, 20)); expect(g.camera.x).toBe(20);
  g.up(1); expect(g.mode).toBe('idle');
});
it('INK-05 cancelで全状態を解放し次のペンが開始できる', () => {
  const g = new Gestures();
  g.down(pen(1), false, false); g.cancel();
  expect(g.mode).toBe('idle'); expect(g.owner).toBeNull();
  expect(g.down(pen(2), false, false)).toBe('draw');
  g.up(99); expect(g.owner).toBe(2);
  g.up(2); expect(g.mode).toBe('idle');
});
it('INK-02 Space/移動モードのマウスは書かず移動する', () => {
  const g = new Gestures();
  g.down({ ...pen(1), kind: 'mouse' }, false, true);
  g.move({ ...pen(1, 50), kind: 'mouse' });
  expect(g.camera.x).toBe(50); expect(g.mode).toBe('panning');
});
