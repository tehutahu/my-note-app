import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { Backup } from '../../src/transfer/backup';

test('DATA-02 delayed and quota-failed commits keep saved data and export the unsaved ink', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'ノートを作る', exact: true }).click();
  await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  const read = () => page.evaluate(async () => {
    const r = indexedDB.open('my-note-app');
    const db = await new Promise<IDBDatabase>((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    try {
      return await Promise.all(['notebooks', 'pages'].map(name => new Promise<unknown[]>(resolve => {
        const q = db.transaction(name).objectStore(name).getAll(); q.onsuccess = () => resolve(q.result);
      })));
    } finally { db.close(); }
  });
  await page.evaluate(async () => {
    const r = indexedDB.open('my-note-app');
    const db = await new Promise<IDBDatabase>(resolve => { r.onsuccess = () => resolve(r.result); });
    const tx = db.transaction(['notebooks', 'pages'], 'readwrite'); let hold = true;
    Object.assign(window, { releaseSave: () => { hold = false; } });
    const keep = () => { const q = tx.objectStore('pages').get('hold'); q.onsuccess = () => { if (hold) keep(); }; }; keep();
    tx.oncomplete = () => db.close();
  });
  const box = (await page.locator('#ink').boundingBox())!;
  await page.mouse.click(box.x + 80, box.y + 80);
  await expect(page.getByTestId('save-status')).toHaveText('保存中…');
  await expect(page.getByTestId('stroke-count')).toHaveText('1筆');
  await page.evaluate(() => (window as unknown as { releaseSave: () => void }).releaseSave());
  await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  const before = await read();
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      if (this.name === 'pages') { IDBObjectStore.prototype.put = put; throw new DOMException('synthetic quota', 'QuotaExceededError'); }
      return put.apply(this, args);
    };
  });
  await page.mouse.click(box.x + 140, box.y + 80);
  await expect(page.getByTestId('save-status')).toContainText('未保存');
  await expect(page.getByRole('button', { name: '再試行', exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('変更は画面に保持');
  expect(await read()).toEqual(before);
  const event = page.waitForEvent('download'); await page.getByRole('button', { name: 'このノートを書き出す', exact: true }).click();
  const backup: Backup = JSON.parse(await readFile((await (await event).path())!, 'utf8'));
  expect(backup.pages[0].elements.map(element => element.type === 'stroke' ? element.points[0].x : null)).toEqual([80, 140]);
  expect(await read()).toEqual(before);
  await expect(page.getByTestId('save-status')).toContainText('未保存');
  await page.getByRole('button', { name: '再試行', exact: true }).click();
  await expect(page.getByTestId('save-status')).toHaveText('保存済み'); await page.reload();
  await expect(page.getByTestId('stroke-count')).toHaveText('2筆');
});
