import { describe, expect, it } from 'vitest';
import { History, hitsStroke, pressureWidth, type Stroke } from '../../src/domain/ink';
describe('INK-01 筆圧', () => {
  it('0.2と0.8で幅を変え、マウスは一定幅', () => {
    expect(pressureWidth(4, .2, 'pen')).toBeCloseTo(1.6);
    expect(pressureWidth(4, .8, 'pen')).toBeCloseTo(3.4);
    expect(pressureWidth(4, 0, 'mouse')).toBe(4);
    expect(pressureWidth(4, .5, 'touch')).toBe(4);
  });
});
describe('INK-04 筆跡消しゴムと履歴', () => {
  const stroke: Stroke = { id: 'a', type: 'stroke', tool: 'pen', color: '#123456', widthPt: 4, points: [{ x: 0, y: 0, p: 1 }, { x: 100, y: 0, p: 1 }] };
  it('サンプル点の間の線分を消し、離れた線は残す', () => {
    expect(hitsStroke(stroke, { x: 50, y: 2 }, 1)).toBe(true);
    expect(hitsStroke(stroke, { x: 50, y: 20 }, 1)).toBe(false);
    expect(hitsStroke(stroke, { x: 120, y: 0 }, 1)).toBe(false);
  });
  it('単点と重複点も消せる。空配列は消さない', () => {
    expect(hitsStroke({ ...stroke, points: [stroke.points[0]] }, { x: 0, y: 1 }, 1)).toBe(true);
    expect(hitsStroke({ ...stroke, points: [stroke.points[0], stroke.points[0]] }, { x: 0, y: 1 }, 1)).toBe(true);
    expect(hitsStroke({ ...stroke, points: [] }, { x: 0, y: 0 }, 1)).toBe(false);
  });
  it('一操作を戻してやり直し、新規編集でRedoを消す', () => {
    const history = new History<string[]>([]);
    history.undo(); history.redo();
    expect(history.current).toEqual([]);
    history.apply(['a', 'b']); history.apply(['b']);
    expect(history.canUndo).toBe(true);
    history.undo(); expect(history.current).toEqual(['a', 'b']);
    expect(history.canRedo).toBe(true);
    history.redo(); expect(history.current).toEqual(['b']);
    history.undo(); history.apply(['c']);
    expect(history.canRedo).toBe(false);
    history.redo(); expect(history.current).toEqual(['c']);
  });
  it('最新100操作だけを保持しUndo/Redo各100回の順序が一致', () => {
    const history = new History(0);
    for (let i = 1; i <= 110; i++) history.apply(i);
    for (let i = 109; i >= 10; i--) { history.undo(); expect(history.current).toBe(i); }
    expect(history.canUndo).toBe(false);
    history.undo(); expect(history.current).toBe(10);
    for (let i = 11; i <= 110; i++) { history.redo(); expect(history.current).toBe(i); }
    expect(history.canRedo).toBe(false);
  });
});
