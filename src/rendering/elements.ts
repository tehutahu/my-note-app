import type { PageElement } from '../domain/notebook';
import { shapePoints } from '../domain/shapes';
import { drawStroke } from './strokes';
export function drawElement(ctx: CanvasRenderingContext2D, element: PageElement, start = 0): void {
  if (element.type === 'stroke') { drawStroke(ctx, element, start); return; }
  const points = shapePoints(element);
  ctx.strokeStyle = element.color; ctx.lineWidth = element.widthPt; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
  for (const point of points.slice(1)) ctx.lineTo(point.x, point.y);
  ctx.stroke();
}
