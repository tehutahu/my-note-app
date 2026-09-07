import { pressureWidth, type Stroke } from '../domain/ink';
export function strokePath(stroke: Stroke, start = 0): string {
  const commands: string[] = [];
  for (let i = start; i < stroke.points.length; i++) {
    const p = stroke.points[i], r = pressureWidth(stroke.widthPt, p.p, 'pen') / 2;
    commands.push(`M${p.x + r} ${p.y}A${r} ${r} 0 1 1 ${p.x - r} ${p.y}A${r} ${r} 0 1 1 ${p.x + r} ${p.y}Z`);
    if (!i) continue;
    const a = stroke.points[i - 1], ra = pressureWidth(stroke.widthPt, a.p, 'pen') / 2, dx = p.x - a.x, dy = p.y - a.y, length = Math.hypot(dx, dy);
    if (!length) continue;
    const nx = -dy / length, ny = dx / length;
    commands.push(`M${a.x - nx * ra} ${a.y - ny * ra}L${p.x - nx * r} ${p.y - ny * r}L${p.x + nx * r} ${p.y + ny * r}L${a.x + nx * ra} ${a.y + ny * ra}Z`);
  }
  return commands.join('');
}
