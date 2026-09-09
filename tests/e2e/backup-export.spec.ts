import { expect, test } from '@playwright/test';
import { fixtureNote } from '../fixtures/performance';
test('XFER-02 oversized backup export gives Japanese guidance and preserves all pages', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'ノートを作る', exact: true })).toBeVisible();
  const note = fixtureNote(1, 1001, 0, 0);
  await page.evaluate(async note => {
    const request = indexedDB.open('my-note-app');
    const db = await new Promise<IDBDatabase>(resolve => { request.onsuccess = () => resolve(request.result); });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['notebooks', 'pages'], 'readwrite'); tx.objectStore('notebooks').put(note.notebook);
      for (const p of note.pages) tx.objectStore('pages').put(p);
      tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error);
    }); db.close();
  }, note);
  await page.reload();
  const downloads: string[] = []; page.on('download', d => downloads.push(d.suggestedFilename()));
  await page.getByRole('button', { name: '全体バックアップを書き出す', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('1000ページ');
  await expect(page.getByRole('alert')).toContainText('ノート単位で書き出してください');
  expect(downloads).toEqual([]);
  expect(await page.evaluate(async () => {
    const r = indexedDB.open('my-note-app'); const db = await new Promise<IDBDatabase>(resolve => { r.onsuccess = () => resolve(r.result); });
    const count = db.transaction('pages').objectStore('pages').count();
    const result = await new Promise<number>(resolve => { count.onsuccess = () => resolve(count.result); }); db.close(); return result;
  })).toBe(1001);
});
