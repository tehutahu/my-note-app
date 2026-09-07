import { expect, test } from '@playwright/test';
import { PDFDocument, degrees, rgb } from 'pdf-lib';
import { readFile } from 'node:fs/promises';
test('PDF-01/02 回転とCropBoxの8ページを取り込み全ページPDFへ出力', async ({ page }) => {
  const pdf = await PDFDocument.create();
  const dimensions: number[][] = [];
  for (const cropped of [false, true]) for (const rotation of [0, 90, 180, 270]) {
    const p = pdf.addPage([400, 300]);
    if (cropped) p.setCropBox(50, 60, 300, 200);
    p.setRotation(degrees(rotation)); p.drawText(`Rotation ${rotation}`, { x: 80, y: 120, size: 16 });
    p.drawRectangle({ x: 100, y: 100, width: 10, height: 10, color: rgb(1, 0, 0) });
    const w = cropped ? 300 : 400, h = cropped ? 200 : 300;
    dimensions.push(rotation % 180 ? [h, w] : [w, h]);
  }
  await page.goto('/'); const input = page.getByLabel('PDFを取り込む', { exact: true });
  await expect(input).toBeVisible();
  await input.setInputFiles({ name: 'rotation-fixture.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await pdf.save()) });
  await expect(page.getByLabel('ページ選択', { exact: true }).locator('option')).toHaveCount(8);
  await page.getByLabel('色', { exact: true }).fill('#0000ff');
  await page.getByLabel('太さ', { exact: true }).fill('12');
  for (let i = 0; i < 8; i++) {
    await page.getByLabel('ページ選択', { exact: true }).selectOption(String(i));
    await expect(page.getByTestId('pdf-status')).toHaveText('PDF表示済み');
    await expect(page.getByTestId('zoom')).toHaveText('100%');
    const canvas = page.getByLabel('手書きキャンバス'), box = (await canvas.boundingBox())!;
    await canvas.dispatchEvent('pointerdown', { pointerId: 1, pointerType: 'pen', pressure: 1, buttons: 1, clientX: box.x + 80, clientY: box.y + 80 });
    await canvas.dispatchEvent('pointerup', { pointerId: 1, pointerType: 'pen', pressure: 0, clientX: box.x + 80, clientY: box.y + 80 });
    await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  }
  const event = page.waitForEvent('download'); await page.getByRole('button', { name: 'PDFを書き出す', exact: true }).click();
  const download = await event; await download.saveAs('/workspace/artifacts/exported-fixture.pdf');
  const output = await PDFDocument.load(await readFile('/workspace/artifacts/exported-fixture.pdf'));
  expect(output.getPageCount()).toBe(8);
  output.getPages().forEach((p, i) => { expect(p.getWidth()).toBeCloseTo(dimensions[i][0], 1); expect(p.getHeight()).toBeCloseTo(dimensions[i][1], 1); });
  // Expected centers are hand-derived from the fixture, independently of product transforms.
  const expectedRed = [[105,195], [105,105], [295,105], [195,295], [55,155], [45,55], [245,45], [155,245]];
  await page.goto('/');
  await page.getByLabel('PDFを取り込む', { exact: true }).setInputFiles('/workspace/artifacts/exported-fixture.pdf');
  await expect(page.getByLabel('ページ選択', { exact: true }).locator('option')).toHaveCount(8);
  for (let i = 0; i < 8; i++) {
    await page.getByLabel('ページ選択', { exact: true }).selectOption(String(i));
    await expect(page.getByTestId('pdf-status')).toHaveText('PDF表示済み');
    const centers = await page.locator('#pdf-layer').evaluate((node: HTMLCanvasElement) => {
      const pixels = node.getContext('2d')!.getImageData(0, 0, node.width, node.height).data;
      const sums = [[0,0,0], [0,0,0]];
      for (let y = 0; y < node.height; y++) for (let x = 0; x < node.width; x++) {
        const p = (y * node.width + x) * 4, r = pixels[p], g = pixels[p+1], b = pixels[p+2];
        const index = r > 200 && g < 40 && b < 40 ? 0 : b > 200 && r < 40 && g < 40 ? 1 : -1;
        if (index >= 0) { sums[index][0] += x + .5; sums[index][1] += y + .5; sums[index][2]++; }
      }
      return sums.map(([x,y,n]) => ({ x: x/n, y: y/n, count: n }));
    });
    for (const [index, expected] of [expectedRed[i], [80,80]].entries()) {
      expect(centers[index].count, `page ${i} marker ${index}`).toBeGreaterThan(20);
      expect(Math.abs(centers[index].x - expected[0])).toBeLessThanOrEqual(1);
      expect(Math.abs(centers[index].y - expected[1])).toBeLessThanOrEqual(1);
    }
  }
});
test('PDF-03 新規ノートの全ページと筆記をPDFへ出力', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'ノートを作る', exact: true }).click();
  const button = page.getByRole('button', { name: 'PDFを書き出す', exact: true }); await expect(button).toBeVisible();
  await page.getByRole('button', { name: 'ページを追加', exact: true }).click();
  const event = page.waitForEvent('download'); await button.click(); const download = await event;
  await download.saveAs('/workspace/artifacts/blank-note.pdf');
  const output = await PDFDocument.load(await readFile('/workspace/artifacts/blank-note.pdf'));
  expect(output.getPageCount()).toBe(2); expect(output.getPages()[0].getWidth()).toBeCloseTo(595.28, 1);
});
