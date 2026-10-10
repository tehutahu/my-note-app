import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';
import type { Backup } from '../../src/transfer/backup';

test('PDF-01/02 A4 and landscape review fixture keeps all eight rotated CropBoxes and annotations', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1280 });
  await page.goto('/');
  await page.getByLabel('PDFを取り込む', { exact: true }).setInputFiles('/workspace/dist/samples/R4.pdf');
  await expect(page.getByLabel('ページ選択', { exact: true }).locator('option')).toHaveCount(8);
  // Independently derived from the documented R4 fixture (red center at PDF x=120,y=110).
  const centers = [[120, 731.89], [110, 120], [475.28, 110], [485.28, 721.89],
    [80, 681.89], [60, 80], [435.28, 60], [435.28, 681.89]];
  const dimensions = [[595.28, 841.89], [595.28, 841.89], [595.28, 841.89], [595.28, 841.89],
    [515.28, 741.89], [495.28, 761.89], [515.28, 741.89], [495.28, 761.89]];
  await page.getByLabel('色', { exact: true }).fill('#0000ff');
  for (let i = 0; i < 8; i++) {
    await page.getByLabel('ページ選択', { exact: true }).selectOption(String(i));
    await expect(page.getByTestId('pdf-status')).toHaveText('PDF表示済み');
    const center = await page.locator('#pdf-layer').evaluate((canvas: HTMLCanvasElement) => {
      const pixels = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
      let x = 0, y = 0, count = 0;
      for (let row = 0; row < canvas.height; row++) for (let col = 0; col < canvas.width; col++) {
        const at = (row * canvas.width + col) * 4;
        if (pixels[at] > 200 && pixels[at + 1] < 40 && pixels[at + 2] < 40) { x += col + .5; y += row + .5; count++; }
      }
      return { x: x / count, y: y / count, count };
    });
    expect(center.count).toBeGreaterThan(20);
    expect(Math.abs(center.x - centers[i][0])).toBeLessThanOrEqual(1);
    expect(Math.abs(center.y - centers[i][1])).toBeLessThanOrEqual(1);
    await page.locator('#ink').evaluate((el, i) => {
      const r = el.getBoundingClientRect();
      for (const type of ['pointerdown', 'pointerup']) el.dispatchEvent(new PointerEvent(type, {
        bubbles: true, pointerType: 'pen', pointerId: 1, button: 0, buttons: type === 'pointerdown' ? 1 : 0,
        pressure: .8, clientX: r.left + 80 + i, clientY: r.top + 80,
      }));
    }, i);
    await expect(page.getByTestId('stroke-count')).toHaveText('1筆');
    await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  }
  const backupEvent = page.waitForEvent('download'); await page.getByRole('button', { name: 'このノートを書き出す', exact: true }).click();
  const backup: Backup = JSON.parse(await readFile((await (await backupEvent).path())!, 'utf8'));
  for (const [i, id] of backup.notebooks[0].pageIds.entries()) {
    const p = backup.pages.find(p => p.id === id)!;
    expect(p.pdfSource!.pageIndex).toBe(i); expect(p.pdfSource!.rotation).toBe((i % 4) * 90);
    expect(p.widthPt).toBeCloseTo(dimensions[i][0], 2); expect(p.heightPt).toBeCloseTo(dimensions[i][1], 2);
    expect(p.elements[0]).toMatchObject({ type: 'stroke', points: [{ x: 80 + i, y: 80, p: Math.fround(.8) }] });
  }
  const event = page.waitForEvent('download'); await page.getByRole('button', { name: 'PDFを書き出す', exact: true }).click();
  const pdf = await PDFDocument.load(await readFile((await (await event).path())!));
  expect(pdf.getPageCount()).toBe(8);
  pdf.getPages().forEach((p, i) => {
    expect(Math.abs(p.getWidth() - dimensions[i][0])).toBeLessThanOrEqual(.1);
    expect(Math.abs(p.getHeight() - dimensions[i][1])).toBeLessThanOrEqual(.1);
  });
});
