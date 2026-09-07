import type { Point } from './coordinates';
export interface InkPoint extends Point { p: number }
export interface Stroke { id: string; type: 'stroke'; tool: 'pen' | 'highlighter'; color: string; widthPt: number; points: InkPoint[] }
export function pressureWidth(width: number, pressure: number, pointerType: string): number {
  return pointerType === 'pen' ? width * (.25 + .75 * pressure) : width;
}
export function hitsStroke(stroke: Stroke, point: Point, radius: number): boolean {
  return stroke.points.some((a, i) => {
    const b = stroke.points[i + 1] ?? a;
    const dx = b.x - a.x, dy = b.y - a.y;
    const length2 = dx * dx + dy * dy;
    const t = length2 === 0 ? 0 : Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / length2));
    return Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy) <= radius + pressureWidth(stroke.widthPt, a.p + (b.p - a.p) * t, 'pen') / 2;
  });
}
/** Callers keep snapshots immutable; history owns at most 100 previous states. */
export class History<T> {
  private past: T[] = [];
  private future: T[] = [];
  constructor(public current: T) {}
  apply(next: T): void {
    this.past.push(this.current);
    if (this.past.length > 100) this.past.shift();
    this.current = next; this.future = [];
  }
  undo(): void {
    if (!this.canUndo) return;
    this.future.push(this.current); this.current = this.past.pop()!;
  }
  redo(): void {
    if (!this.canRedo) return;
    this.past.push(this.current); this.current = this.future.pop()!;
  }
  get canUndo(): boolean { return this.past.length > 0; }
  get canRedo(): boolean { return this.future.length > 0; }
}
