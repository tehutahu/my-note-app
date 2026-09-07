import type { Point } from './coordinates';
import { hitsStroke } from './ink';
export interface Shape { id: string; type: 'shape'; kind: 'line' | 'rectangle' | 'ellipse'; x1: number; y1: number; x2: number; y2: number; color: string; widthPt: number }
export function shapePoints(shape: Shape): Point[] {
  const { x1, y1, x2, y2 } = shape;
  if (shape.kind === 'line' || x1 === x2 || y1 === y2) return [{ x: x1, y: y1 }, { x: x2, y: y2 }];
  if (shape.kind === 'rectangle') return [{ x: x1, y: y1 }, { x: x2, y: y1 }, { x: x2, y: y2 }, { x: x1, y: y2 }, { x: x1, y: y1 }];
  const rx = Math.abs(x2 - x1) / 2, ry = Math.abs(y2 - y1) / 2;
  const segments = Math.max(64, Math.ceil(Math.PI * Math.sqrt(Math.max(rx, ry) / .1)));
  return Array.from({ length: segments + 1 }, (_, i) => ({ x: (x1 + x2) / 2 + rx * Math.cos(i * 2 * Math.PI / segments), y: (y1 + y2) / 2 + ry * Math.sin(i * 2 * Math.PI / segments) }));
}
export function hitsShape(shape: Shape, point: Point, radius: number): boolean {
  return hitsStroke({ id: shape.id, type: 'stroke', tool: 'pen', color: shape.color, widthPt: shape.widthPt, points: shapePoints(shape).map(p => ({ ...p, p: 1 })) }, point, radius);
}
