import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';

test('PWA-04 subpath PDF direct links, all local assets and offline restart', async ({ page, context, request, baseURL }) => {
  const external: string[] = [], errors: string[] = [], writes: string[] = [];
  context.on('request', req => {
    if (/^https?:/.test(req.url()) && !req.url().startsWith(baseURL!)) external.push(req.url());
    if (req.method() !== 'GET') writes.push(req.url());
  });
  context.on('response', response => { if (response.status() >= 400) errors.push(response.url()); });
  await page.goto('./');
  await expect(page.getByTestId('offline-status')).toHaveText('オフライン準備完了', { timeout: 20000 });
  const worker = await (await request.get('sw.js')).text();
  const assets = JSON.parse(worker.match(/const ASSETS = (\[.*\]);/)![1]) as string[];
  expect(assets.length).toBeGreaterThan(100);
  for (const asset of assets) {
    const url = new URL(asset, baseURL);
    expect(url.href.startsWith(baseURL!)).toBe(true);
    expect((await request.get(url.href)).status(), asset).toBe(200);
  }
  const manifest = await (await request.get('manifest.webmanifest')).json();
  expect(new URL(manifest.start_url, baseURL).href).toBe(baseURL);
  expect(new URL(manifest.scope, baseURL).href).toBe(baseURL);
  for (const icon of manifest.icons) expect((await request.get(new URL(icon.src, baseURL).href)).ok()).toBe(true);
  expect(await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.scope)).toBe(baseURL);
  await page.evaluate(async () => { await caches.open('unrelated-subpath-fixture'); });
  const pdf = await PDFDocument.create(); pdf.addPage().drawText('Subpath text');
  await page.getByLabel('PDFを取り込む', { exact: true }).setInputFiles({ name: 'subpath.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await pdf.save()) });
  await expect(page.getByTestId('pdf-status')).toHaveText('PDF表示済み');
  const direct = page.url(); expect(direct).toContain('/my-note-app/#note=');
  await page.goto(direct);
  await expect(page.getByTestId('pdf-status')).toHaveText('PDF表示済み');
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId('pdf-status')).toHaveText('PDF表示済み');
  const box = (await page.getByLabel('手書きキャンバス').boundingBox())!;
  await page.mouse.click(box.x + 60, box.y + 60);
  await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  await page.reload();
  await expect(page.getByTestId('stroke-count')).toHaveText('1筆');
  expect(await page.evaluate(() => caches.keys())).toContain('unrelated-subpath-fixture');
  expect(external).toEqual([]); expect(errors).toEqual([]); expect(writes).toEqual([]);
});
