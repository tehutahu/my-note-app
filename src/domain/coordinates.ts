export interface Point { x: number; y: number }
export interface View { left: number; top: number; panX: number; panY: number; zoom: number }
/** CSS pixels only; devicePixelRatio belongs to the rendering buffer. */
export function toPage(point: Point, view: View): Point {
  return { x: (point.x - view.left - view.panX) / view.zoom, y: (point.y - view.top - view.panY) / view.zoom };
}
export function toScreen(point: Point, view: View): Point {
  return { x: point.x * view.zoom + view.left + view.panX, y: point.y * view.zoom + view.top + view.panY };
}
