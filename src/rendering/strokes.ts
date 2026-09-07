import type { Stroke } from '../domain/ink';
import { strokePath } from './outline';
export function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke, start = 0): void {
  ctx.save(); ctx.fillStyle = stroke.color; ctx.globalAlpha = stroke.tool === 'highlighter' ? .25 : 1;
  ctx.fill(new Path2D(strokePath(stroke, start))); ctx.restore();
}
