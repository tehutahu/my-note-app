import type { Page } from '../domain/notebook';
export function drawBackground(ctx: CanvasRenderingContext2D, page: Page, fill = true): void {
  ctx.fillStyle = page.background.color;
  if (fill) ctx.fillRect(0, 0, page.widthPt, page.heightPt);
  if (page.background.kind === 'plain') return;
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, page.widthPt, page.heightPt); ctx.clip();
  ctx.strokeStyle = '#b8c9c1'; ctx.lineWidth = .5; ctx.beginPath();
  for (let y = 24; y < page.heightPt; y += 24) { ctx.moveTo(0, y); ctx.lineTo(page.widthPt, y); }
  if (page.background.kind === 'grid') for (let x = 24; x < page.widthPt; x += 24) { ctx.moveTo(x, 0); ctx.lineTo(x, page.heightPt); }
  ctx.stroke(); ctx.restore();
}
