import { expect, test } from '@playwright/test';
import { PDFDocument, rgb } from 'pdf-lib';
test('PDF-05 100ページ往復と連続切替で最終ページだけを表示しDPR3でも64MiB以内', async ({ browser }) => {
  test.setTimeout(180000);
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 3, serviceWorkers: 'block' });
  try {
    await context.addInitScript(() => {
      const canvases: HTMLCanvasElement[] = [], original = document.createElement.bind(document);
      document.createElement = ((...args: Parameters<Document['createElement']>) => {
        const node = original(...args); if (node instanceof HTMLCanvasElement) canvases.push(node); return node;
      }) as Document['createElement'];
      const metrics = { maxBytes: 0, maxDetached: 0, samples: 0 };
      Object.assign(window, { rasterMetrics: metrics });
      const sample = () => {
        const all = new Set([...canvases, ...document.querySelectorAll('canvas')]);
        let bytes = 0, detached = 0;
        for (const canvas of all) { bytes += canvas.width * canvas.height * 4; if (!canvas.isConnected && canvas.width && canvas.height) detached++; }
        metrics.maxBytes = Math.max(metrics.maxBytes, bytes); metrics.maxDetached = Math.max(metrics.maxDetached, detached); metrics.samples++;
        requestAnimationFrame(sample);
      }; requestAnimationFrame(sample);
    });
    const page = await context.newPage(), pdf = await PDFDocument.create();
    for (let i = 0; i < 100; i++) pdf.addPage([400,300]).drawRectangle({ x: 20 + i, y: 150, width: 10, height: 10, color: rgb(1,0,0) });
    await page.goto('http://127.0.0.1:4173/');
    await page.getByLabel('PDFを取り込む', { exact: true }).setInputFiles({ name: 'hundred-pages.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await pdf.save()) });
    const select = page.getByLabel('ページ選択', { exact: true }); await expect(select.locator('option')).toHaveCount(100);
    const indices = Array.from({ length: 100 }, (_, i) => i);
    for (const i of [...indices, ...indices.reverse()]) {
      await select.selectOption(String(i)); await expect(page.getByTestId('pdf-status')).toHaveText('PDF表示済み');
    }
    await select.evaluate((node: HTMLSelectElement) => {
      for (const value of ['5','80','12','99']) { node.value = value; node.dispatchEvent(new Event('change', { bubbles: true })); }
    });
    await expect(page.getByTestId('pdf-status')).toHaveText('PDF表示済み');
    const marker = await page.locator('#pdf-layer').evaluate((canvas: HTMLCanvasElement) => {
      const data = canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height).data;
      let x = 0, y = 0, count = 0;
      for (let j = 0; j < canvas.height; j++) for (let i = 0; i < canvas.width; i++) {
        const at = (j * canvas.width + i) * 4;
        if (data[at] > 200 && data[at+1] < 40 && data[at+2] < 40) { x += i+.5; y += j+.5; count++; }
      }
      const scale = canvas.width / canvas.getBoundingClientRect().width;
      return { x: x/count/scale, y: y/count/scale, count };
    });
    expect(marker.count).toBeGreaterThan(20); expect(Math.abs(marker.x - 124)).toBeLessThanOrEqual(1); expect(Math.abs(marker.y - 145)).toBeLessThanOrEqual(1);
    const metrics = await page.evaluate(() => (window as unknown as { rasterMetrics: { maxBytes: number; maxDetached: number; samples: number } }).rasterMetrics);
    await test.info().attach('raster-metrics', { body: JSON.stringify(metrics), contentType: 'application/json' });
    expect(metrics.samples).toBeGreaterThan(100); expect(metrics.maxBytes).toBeLessThanOrEqual(64 * 1024 * 1024); expect(metrics.maxDetached).toBeLessThanOrEqual(3);
  } finally { await context.close(); }
});

test('PDF-05 Workerの描画要求を保留中にページ移動し、遅れて解放しても旧画像が戻らない', async ({ page }) => {
  await page.addInitScript(() => {
    const original = Worker.prototype.postMessage;
    let held: (() => void) | undefined;
    const state = { held: false, released: false };
    Object.assign(window, { delayedPdf: state, releasePdf: () => { held?.(); held = undefined; state.released = true; } });
    Worker.prototype.postMessage = (function (this: Worker, ...args: Parameters<Worker['postMessage']>) {
      const message = args[0];
      if (message?.action === 'GetOperatorList' && message.data?.pageIndex === 1 && !state.held) {
        state.held = true; held = () => original.apply(this, args); return;
      }
      original.apply(this, args);
    }) as Worker['postMessage'];
  });
  const pdf = await PDFDocument.create();
  for (let i = 0; i < 3; i++) pdf.addPage([400,300]).drawRectangle({ x: 20 + i * 100, y: 150, width: 10, height: 10, color: rgb(1,0,0) });
  await page.goto('/');
  await page.getByLabel('PDFを取り込む', { exact: true }).setInputFiles({ name: 'delayed.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await pdf.save()) });
  await expect(page.getByTestId('pdf-status')).toHaveText('PDF表示済み');
  const select = page.getByLabel('ページ選択', { exact: true }); await select.selectOption('1');
  await page.waitForFunction(() => (window as unknown as { delayedPdf: { held: boolean } }).delayedPdf.held);
  await expect(page.getByTestId('pdf-status')).toHaveText('PDF表示中…');
  await select.selectOption('2'); await expect(page.getByTestId('pdf-status')).toHaveText('PDF表示済み');
  const read = () => page.locator('#pdf-layer').evaluate((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d')!;
    return [...ctx.getImageData(225,145,1,1).data, ...ctx.getImageData(125,145,1,1).data];
  });
  const before = await read(); expect(before.slice(0,3)).toEqual([255,0,0]); expect(before.slice(4,7)).toEqual([255,255,255]);
  await page.evaluate(async () => {
    (window as unknown as { releasePdf: () => void }).releasePdf();
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
  expect(await read()).toEqual(before); await expect(select).toHaveValue('2');
});
