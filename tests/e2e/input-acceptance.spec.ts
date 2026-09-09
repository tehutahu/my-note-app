import { expect, test } from '@playwright/test';

test('INK-01/04 100 pressure strokes and 10 visible dots survive 100 undo/redo operations', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'ノートを作る', exact: true }).click();
  await page.getByLabel('色', { exact: true }).fill('#000000'); await page.getByLabel('太さ', { exact: true }).fill('12');
  await page.locator('#ink').evaluate(el => {
    const r = el.getBoundingClientRect();
    const send = (type: string, x: number, y: number, pressure: number) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 70, pointerType: 'pen', button: 0, buttons: type === 'pointerup' ? 0 : 1, pressure, clientX: r.left + x, clientY: r.top + y }));
    for (let i = 0; i < 100; i++) {
      const x = 30 + (i % 10) * 50, y = 40 + Math.floor(i / 10) * 30, p = i % 2 ? .8 : .2;
      send('pointerdown', x, y, p); send('pointermove', x + 10, y, p); send('pointerup', x + 30, y, 0);
    }
    for (let i = 0; i < 10; i++) { send('pointerdown', 30 + i * 40, 380, .8); send('pointerup', 30 + i * 40, 380, 0); }
  });
  await expect(page.getByTestId('stroke-count')).toHaveText('110筆');
  await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  const pixels = await page.locator('#committed').evaluate((node: HTMLCanvasElement) => {
    const ctx = node.getContext('2d')!;
    const thickness = (x: number) => { let count = 0; for (let y = 25; y < 55; y++) if (ctx.getImageData(x, y, 1, 1).data[0] < 80) count++; return count; };
    return { low: thickness(45), high: thickness(95), dots: Array.from({ length: 10 }, (_, i) => ctx.getImageData(30 + i * 40, 380, 1, 1).data[0]) };
  });
  expect(pixels.low).toBeGreaterThan(0); expect(pixels.high).toBeGreaterThan(pixels.low); expect(pixels.dots.every(value => value < 80)).toBe(true);
  for (const [name, count] of [['元に戻す', '10筆'], ['やり直す', '110筆']] as const) {
    await page.getByRole('button', { name, exact: true }).evaluate(el => { for (let i = 0; i < 100; i++) (el as HTMLButtonElement).click(); });
    await expect(page.getByTestId('stroke-count')).toHaveText(count);
  }
  await page.getByRole('button', { name: '消しゴム', exact: true }).click();
  await page.locator('#ink').scrollIntoViewIfNeeded();
  let box = (await page.locator('#ink').boundingBox())!;
  for (let i = 0; i < 10; i++) await page.mouse.click(box.x + 30 + i * 40, box.y + 380);
  await expect(page.getByTestId('stroke-count')).toHaveText('100筆');
  await page.getByRole('button', { name: '元に戻す', exact: true }).evaluate(el => { for (let i = 0; i < 10; i++) (el as HTMLButtonElement).click(); });
  await expect(page.getByTestId('stroke-count')).toHaveText('110筆');
  await page.getByRole('button', { name: 'ペン', exact: true }).click(); await page.locator('#ink').scrollIntoViewIfNeeded();
  box = (await page.locator('#ink').boundingBox())!; await page.mouse.click(box.x + 60, box.y + 420);
  await expect(page.getByRole('button', { name: 'やり直す', exact: true })).toBeDisabled();
});

test('INK-05 releasing a captured pointer outside the canvas discards the unfinished operation', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'ノートを作る', exact: true }).click();
  const box = (await page.locator('#ink').boundingBox())!;
  await page.mouse.move(box.x + 50, box.y + 50); await page.mouse.down();
  await page.mouse.move(box.x + 100, box.y + 100); await page.mouse.move(box.x - 10, box.y - 10); await page.mouse.up();
  await expect(page.getByTestId('stroke-count')).toHaveText('0筆');
  await page.mouse.click(box.x + 80, box.y + 80);
  await expect(page.getByTestId('stroke-count')).toHaveText('1筆');
});

for (const dpr of [1, 2, 3]) test(`INK-03 DPR ${dpr}: four zoom levels and pan preserve cursor coordinates and visible ink`, async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: dpr, serviceWorkers: 'block' });
  try {
    const page = await context.newPage(); await page.goto('http://127.0.0.1:4173/');
    await page.getByRole('button', { name: 'ノートを作る', exact: true }).click();
    await page.getByLabel('色', { exact: true }).fill('#000000'); await page.getByLabel('太さ', { exact: true }).fill('12');
    for (const zoom of [.25, 1, 2, 4]) for (const pan of [0, 30]) {
      await page.getByRole('button', { name: '用紙を合わせる', exact: true }).click();
      await page.locator('#ink').evaluate((el, p) => {
        const r = el.getBoundingClientRect();
        const send = (type: string, id: number, x: number, y: number, kind = 'touch') => el.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: id, pointerType: kind, button: 0, buttons: type === 'pointerup' ? 0 : 1, pressure: .8, clientX: r.left + x, clientY: r.top + y }));
        // Pinch around page origin: the first contact remains at (0,0).
        send('pointerdown', 1, 0, 0); send('pointerdown', 2, 100, 0); send('pointermove', 2, 100 * p.zoom, 0);
        send('pointerup', 2, 100 * p.zoom, 0); send('pointerup', 1, 0, 0);
        send('pointerdown', 3, 10, 10); send('pointermove', 3, 10 + p.pan, 10 + p.pan); send('pointerup', 3, 10 + p.pan, 10 + p.pan);
        send('pointerdown', 9, 100 * p.zoom + p.pan, 80 * p.zoom + p.pan, 'pen'); send('pointerup', 9, 100 * p.zoom + p.pan, 80 * p.zoom + p.pan, 'pen');
      }, { zoom, pan });
      await expect(page.getByTestId('zoom')).toHaveText(`${zoom * 100}%`);
      await expect(page.getByTestId('save-status')).toHaveText('保存済み');
      const point = await page.evaluate(async () => {
        const r = indexedDB.open('my-note-app'); const db = await new Promise<IDBDatabase>(resolve => { r.onsuccess = () => resolve(r.result); });
        const get = db.transaction('pages').objectStore('pages').getAll();
        const pages = await new Promise<{ elements: { points: { x: number; y: number }[] }[] }[]>(resolve => { get.onsuccess = () => resolve(get.result); });
        db.close(); return pages[0].elements.at(-1)!.points[0];
      });
      expect(Math.abs(point.x - 100)).toBeLessThanOrEqual(.1); expect(Math.abs(point.y - 80)).toBeLessThanOrEqual(.1);
      const red = await page.locator('#committed').evaluate((canvas: HTMLCanvasElement, p) => {
        const scale = canvas.width / canvas.getBoundingClientRect().width;
        return canvas.getContext('2d')!.getImageData(Math.floor((100 * p.zoom + p.pan) * scale), Math.floor((80 * p.zoom + p.pan) * scale), 1, 1).data[0];
      }, { zoom, pan });
      expect(red).toBeLessThan(100);
    }
  } finally { await context.close(); }
});
