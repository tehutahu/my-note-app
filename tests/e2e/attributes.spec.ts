import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { Backup } from '../../src/transfer/backup';

test('NOTE-03/PDF-03 all shape widths/colors/backgrounds survive reload and three-page PDF output', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto('/'); await page.getByRole('button', { name: 'ノートを作る', exact: true }).click();
  const expected: { background: { kind: string; color: string }; elements: Record<string, unknown>[] }[] = [];
  for (const [pageIndex, background] of [{ kind: 'plain', color: '#fffefb' }, { kind: 'ruled', color: '#ffffff' }, { kind: 'grid', color: '#fafafa' }].entries()) {
    if (pageIndex) await page.getByRole('button', { name: 'ページを追加', exact: true }).click();
    await page.getByLabel('用紙の背景', { exact: true }).selectOption(background.kind);
    await page.getByLabel('背景色', { exact: true }).fill(background.color);
    const elements: Record<string, unknown>[] = [];
    for (const [kind, label] of [['line', '直線'], ['rectangle', '長方形'], ['ellipse', '楕円']]) for (const widthPt of [.5, 3, 12]) for (const color of ['#ff0000', '#00ff00', '#0000ff']) {
      await page.getByRole('button', { name: label, exact: true }).click();
      await page.getByLabel('太さ', { exact: true }).fill(String(widthPt)); await page.getByLabel('色', { exact: true }).fill(color);
      const i = elements.length, x1 = 20 + (i % 9) * 55, y1 = 30 + Math.floor(i / 9) * 70, x2 = x1 + 30, y2 = y1 + 40;
      await page.locator('#ink').evaluate((el, p) => {
        const r = el.getBoundingClientRect();
        for (const [type, x, y] of [['pointerdown', p.x1, p.y1], ['pointerup', p.x2, p.y2]] as const)
          el.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType: 'pen', pointerId: 91, button: 0, buttons: type === 'pointerdown' ? 1 : 0, pressure: .8, clientX: r.left + x, clientY: r.top + y }));
      }, { x1, y1, x2, y2 });
      elements.push({ type: 'shape', kind, widthPt, color, x1, y1, x2, y2 });
    }
    expected.push({ background, elements });
  }
  await expect(page.getByTestId('save-status')).toHaveText('保存済み'); await page.reload();
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'このノートを書き出す', exact: true }).click();
  const backup: Backup = JSON.parse(await readFile((await (await download).path())!, 'utf8'));
  expect(backup.notebooks[0].pageIds).toHaveLength(3);
  for (const [i, id] of backup.notebooks[0].pageIds.entries()) {
    const stored = backup.pages.find(p => p.id === id)!;
    expect(stored.background).toEqual(expected[i].background);
    expect(stored.elements.map(element => Object.fromEntries(Object.entries(element).filter(([key]) => key !== 'id')))).toEqual(expected[i].elements);
  }
  const pixelSample = async (selector: string) => page.locator(selector).evaluate((canvas: HTMLCanvasElement) => {
    const scale = canvas.width / canvas.getBoundingClientRect().width, ctx = canvas.getContext('2d')!;
    return [[475, 50], [458, 98], [475, 120], [475, 170], [458, 168], [475, 190]].map(([x, y]) => ctx.getImageData(Math.floor(x * scale), Math.floor(y * scale), 1, 1).data[0]);
  });
  for (let i = 0; i < 3; i++) {
    await page.getByLabel('ページ選択', { exact: true }).selectOption(String(i));
    await expect(page.getByTestId('element-count')).toHaveText('27要素');
    const red = await pixelSample('#committed');
    for (const index of [0, 1, 3]) expect(red[index], JSON.stringify({ page: i, index, red })).toBeLessThan(80);
    for (const index of [2, 4, 5]) expect(red[index]).toBeGreaterThan(100);
  }
  const pdfDownload = page.waitForEvent('download'); await page.getByRole('button', { name: 'PDFを書き出す', exact: true }).click();
  const pdfPath = (await (await pdfDownload).path())!;
  await page.getByRole('button', { name: 'ノート一覧', exact: true }).click();
  await page.getByLabel('PDFを取り込む', { exact: true }).setInputFiles({ name: 'attribute-matrix.pdf', mimeType: 'application/pdf', buffer: await readFile(pdfPath) });
  await expect(page.getByLabel('ページ選択', { exact: true }).locator('option')).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    await page.getByLabel('ページ選択', { exact: true }).selectOption(String(i)); await expect(page.getByTestId('pdf-status')).toHaveText('PDF表示済み');
    const red = await pixelSample('#pdf-layer');
    await page.screenshot({ path: `artifacts/attributes-pdf-${i}.png`, fullPage: true });
    for (const index of [0, 1, 3]) expect(red[index], JSON.stringify({ page: i, index, red })).toBeLessThan(80);
    for (const index of [2, 4, 5]) expect(red[index]).toBeGreaterThan(100);
  }
});
