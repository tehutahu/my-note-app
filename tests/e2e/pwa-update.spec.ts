import { expect, test } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
test('PWA-03 未保存タブがある更新を拒否し保存後の明示適用でデータを保持', async ({ page, context }) => {
  test.setTimeout(60000);
  await context.addInitScript(() => {
    const events: string[] = []; Object.assign(window, { updateEvents: events });
    navigator.serviceWorker.addEventListener('message', e => { events.push(JSON.stringify(e.data)); });
  });
  const path = '/workspace/dist/sw.js', original = await readFile(path, 'utf8');
  try {
    await page.goto('/'); await expect(page.getByTestId('offline-status')).toHaveText('オフライン準備完了');
    await page.getByRole('button', { name: 'ノートを作る', exact: true }).click();
    const other = await context.newPage(); await other.goto(page.url());
    await expect(other.getByTestId('save-status')).toHaveText('保存済み');
    await other.evaluate(() => {
      const put = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function (...args) { const request = put.apply(this, args); if (this.name === 'pages') { this.transaction.abort(); IDBObjectStore.prototype.put = put; } return request; };
    });
    const canvas = other.getByLabel('手書きキャンバス'); const box = (await canvas.boundingBox())!;
    await other.mouse.click(box.x + 50, box.y + 50);
    await expect(other.getByTestId('save-status')).toContainText('未保存');
    await page.evaluate(async () => { await caches.open('unrelated-cache'); });
    await writeFile(path, original.replace(/const VERSION = "[^"]+";/, 'const VERSION = "update-fixture";'));
    await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration())!.update(); });
    const update = page.getByRole('button', { name: '新しい版を適用', exact: true }); await expect(update).toBeVisible({ timeout: 20000 });
    await update.click();
    try { await expect(page.getByTestId('update-status')).toContainText('別のタブ'); }
    catch (error) {
      for (const tab of [page, other]) console.log(await tab.evaluate(() => ({ events: (window as unknown as { updateEvents: string[] }).updateEvents, inert: document.body.inert, save: document.querySelector('[data-testid=save-status]')?.textContent, version: document.querySelector('.version')?.textContent })));
      throw error;
    }
    await expect(other.getByTestId('stroke-count')).toHaveText('1筆');
    await other.getByRole('button', { name: '再試行', exact: true }).click();
    await expect(other.getByTestId('save-status')).toHaveText('保存済み');
    await update.click();
    await expect(page.locator('.version')).toContainText('update-fixture');
    await expect(page.getByTestId('stroke-count')).toHaveText('1筆');
    await expect(other.locator('.version')).toContainText('update-fixture');
    const keys = await page.evaluate(() => caches.keys());
    expect(keys).toContain('unrelated-cache'); expect(keys.filter(key => key.startsWith('tenohira-'))).toHaveLength(1);
  } finally { await writeFile(path, original); }
});
