import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
test('NOTE-05/PDF-03 蛍光ペンの交差濃度を再表示・ズーム・PDF出力で保持', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'ノートを作る', exact: true }).click();
  await expect(page.getByRole('button', { name: '蛍光ペン', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '蛍光ペン', exact: true }).click();
  await page.getByLabel('太さ', { exact: true }).fill('12');
  const canvas = page.getByLabel('手書きキャンバス', { exact: true });
  const draw = async (points: number[][]) => {
    await canvas.evaluate((el, points) => {
      const r = el.getBoundingClientRect();
      for (let i = 0; i < points.length; i++) el.dispatchEvent(new PointerEvent(i === 0 ? 'pointerdown' : i === points.length - 1 ? 'pointerup' : 'pointermove', { pointerId: 90, pointerType: 'pen', clientX: r.left + points[i][0], clientY: r.top + points[i][1], button: 0, pressure: 1, bubbles: true }));
    }, points);
  };
  const rgb = (x: number, y: number) => page.locator('#committed').evaluate((el, p) => [...(el as HTMLCanvasElement).getContext('2d')!.getImageData(p.x, p.y, 1, 1).data].slice(0, 3), { x, y });
  await draw([[50, 50], [150, 150], [50, 150], [150, 50]]);
  const once = await rgb(100, 100);
  expect(await rgb(75, 75)).toEqual(once);
  await draw([[60, 100], [140, 100]]);
  const twice = await rgb(100, 100); expect(twice[0]).toBeLessThan(once[0]);
  await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  await page.reload(); expect(await rgb(100, 100)).toEqual(twice);
  await canvas.evaluate(el => {
    const r = el.getBoundingClientRect();
    for (const [type, id, x] of [['pointerdown', 1, 0], ['pointerdown', 2, 100], ['pointermove', 2, 200], ['pointerup', 2, 200], ['pointerup', 1, 0]] as const)
      el.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType: 'touch', pointerId: id, button: 0, clientX: r.left + x, clientY: r.top }));
  });
  await expect(page.getByTestId('zoom')).toHaveText('200%');
  for (const [position, expected] of [[150, once], [200, twice]] as const) {
    const zoomed = await rgb(position, position);
    zoomed.forEach((channel, i) => expect(Math.abs(channel - expected[i])).toBeLessThanOrEqual(2));
  }
  const event = page.waitForEvent('download'); await page.getByRole('button', { name: 'PDFを書き出す', exact: true }).click();
  const buffer = await readFile((await (await event).path())!);
  await page.getByRole('button', { name: 'ノート一覧', exact: true }).click();
  await page.getByLabel('PDFを取り込む', { exact: true }).setInputFiles({ name: 'highlighter.pdf', mimeType: 'application/pdf', buffer });
  await expect(page.getByTestId('pdf-status')).toHaveText('PDF表示済み');
  for (const [position, expected] of [[75, once], [100, twice]] as const) {
    const exported = await page.locator('#pdf-layer').evaluate((node: HTMLCanvasElement, n) => [...node.getContext('2d')!.getImageData(n, n, 1, 1).data].slice(0, 3), position);
    exported.forEach((channel, i) => expect(Math.abs(channel - expected[i])).toBeLessThanOrEqual(2));
  }
});
