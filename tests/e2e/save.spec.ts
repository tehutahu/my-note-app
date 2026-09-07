import { expect, test } from '@playwright/test';
test('DATA-01 ノート名と筆跡が保存完了後の再読み込みで復元される', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'ノートを作る', exact: true }).click();
  await page.getByLabel('ノート名', { exact: true }).fill('保存の確認');
  await page.getByLabel('ノート名', { exact: true }).press('Tab');
  const box = (await page.getByLabel('手書きキャンバス', { exact: true }).boundingBox())!;
  await page.mouse.move(box.x + 100, box.y + 100); await page.mouse.down(); await page.mouse.move(box.x + 180, box.y + 130); await page.mouse.up();
  await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  await page.reload();
  await expect(page.getByLabel('ノート名', { exact: true })).toHaveValue('保存の確認');
  await expect(page.getByTestId('stroke-count')).toHaveText('1筆');
  await page.getByRole('button', { name: 'ノート一覧', exact: true }).click();
  await page.getByRole('button', { name: '保存の確認', exact: true }).click();
  await expect(page.getByTestId('stroke-count')).toHaveText('1筆');
});
test('DATA-02 実IndexedDBのabortで未保存を表示し再試行できる', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'ノートを作る', exact: true }).click();
  await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      const request = original.apply(this, args);
      if (this.name === 'pages') { this.transaction.abort(); IDBObjectStore.prototype.put = original; }
      return request;
    };
  });
  const box = (await page.getByLabel('手書きキャンバス', { exact: true }).boundingBox())!;
  await page.mouse.click(box.x + 100, box.y + 100);
  await expect(page.getByTestId('save-status')).toContainText('未保存');
  await expect(page.getByTestId('stroke-count')).toHaveText('1筆');
  const count = await page.evaluate(async () => {
    const request = indexedDB.open('my-note-app');
    const db = await new Promise<IDBDatabase>(resolve => { request.onsuccess = () => resolve(request.result); });
    const pages = db.transaction('pages').objectStore('pages').getAll();
    return new Promise<number>(resolve => { pages.onsuccess = () => { db.close(); resolve(pages.result[0].elements.length); }; });
  });
  expect(count).toBe(0);
  await page.getByRole('button', { name: '再試行', exact: true }).click();
  await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  await page.reload(); await expect(page.getByTestId('stroke-count')).toHaveText('1筆');
});

test('DATA-01 200筆の座標・筆圧・順序を20回の再読み込みで保持', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto('/'); await page.getByRole('button', { name: 'ノートを作る', exact: true }).click();
  await page.getByLabel('手書きキャンバス', { exact: true }).evaluate(el => {
    const rect = el.getBoundingClientRect();
    for (let i = 0; i < 200; i++) {
      for (const [type, offset, p] of [['pointerdown', 0, .2], ['pointermove', 10, .8], ['pointerup', 20, 0]] as const) {
        el.dispatchEvent(new PointerEvent(type, { pointerId: i + 100, pointerType: 'pen', clientX: rect.left + 20 + (i % 20) * 20 + offset, clientY: rect.top + 20 + Math.floor(i / 20) * 20, button: 0, pressure: p, bubbles: true }));
      }
    }
  });
  await expect(page.getByTestId('stroke-count')).toHaveText('200筆');
  await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  const read = () => page.evaluate(async () => {
    const opened = indexedDB.open('my-note-app');
    const db = await new Promise<IDBDatabase>(resolve => { opened.onsuccess = () => resolve(opened.result); });
    const operation = db.transaction('pages').objectStore('pages').getAll();
    return new Promise<string>(resolve => { operation.onsuccess = () => { db.close(); resolve(JSON.stringify(operation.result[0].elements)); }; });
  });
  const expected = await read();
  for (let i = 0; i < 20; i++) {
    await page.reload(); await expect(page.getByTestId('stroke-count')).toHaveText('200筆');
    expect(await read()).toBe(expected);
  }
});
