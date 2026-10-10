import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

test('PWA-04/PERF-01/04 optional review samples download under the controlled subpath and preserve existing notes', async ({ page, request }) => {
  await page.goto('./');
  await expect(page.getByTestId('offline-status')).toHaveText('オフライン準備完了', { timeout: 20000 });
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await page.getByRole('button', { name: 'ノートを作る', exact: true }).click();
  await page.getByLabel('ノート名', { exact: true }).fill('既存ノートの保全確認');
  await page.getByLabel('ノート名', { exact: true }).press('Tab');
  const box = (await page.getByLabel('手書きキャンバス').boundingBox())!;
  await page.mouse.click(box.x + 60, box.y + 60);
  await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  const existing = page.url();

  await page.goto('samples/');
  await expect(page.getByRole('heading', { name: '確認用サンプル', exact: true })).toBeVisible();
  await page.screenshot({ path: 'artifacts/review-samples.png', fullPage: true });
  const response = await request.get('samples/manifest.json');
  expect(response.ok()).toBe(true);
  const manifest = await response.json() as { files: Record<string, { bytes: number; sha256: string }> };
  let sample: Buffer | undefined;
  for (const [name, label] of [['S.snote', '筆記計測用ノート S を保存'], ['P.pdf', 'PDF計測用 P を保存'], ['R4.pdf', '回転・用紙確認用 R4 を保存']]) {
    const event = page.waitForEvent('download');
    await page.getByRole('link', { name: label, exact: true }).click();
    const download = await event;
    expect(download.suggestedFilename()).toBe(name);
    const bytes = await readFile((await download.path())!);
    expect(bytes.length).toBe(manifest.files[name].bytes);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(manifest.files[name].sha256);
    if (name === 'S.snote') sample = bytes;
  }
  expect(await page.evaluate(async () => {
    const urls = await Promise.all((await caches.keys()).filter(key => key.startsWith('tenohira-')).map(async key => (await (await caches.open(key)).keys()).map(request => request.url)));
    return urls.flat().filter(url => url.includes('/samples/'));
  })).toEqual([]);

  await page.goto(existing);
  await expect(page.getByLabel('ノート名', { exact: true })).toHaveValue('既存ノートの保全確認');
  await expect(page.getByTestId('stroke-count')).toHaveText('1筆');
  await page.getByRole('button', { name: 'ノート一覧', exact: true }).click();
  await page.getByLabel('バックアップを読み込む', { exact: true }).setInputFiles({ name: 'S.snote', mimeType: 'application/json', buffer: sample! });
  await expect(page.getByRole('button', { name: '筆記計測サンプル S', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '既存ノートの保全確認', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '筆記計測サンプル S', exact: true }).click();
  await expect(page.getByTestId('element-count')).toHaveText('2100要素');
});
