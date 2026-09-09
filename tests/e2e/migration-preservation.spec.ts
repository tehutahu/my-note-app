import { expect, test, type Page } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { createHash } from 'node:crypto';
async function records(page: Page) {
  return page.evaluate(async () => {
    const r = indexedDB.open('my-note-app'); const db = await new Promise<IDBDatabase>((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    const names = ['folders', 'notebooks', 'pages', 'attachments', 'meta'];
    const tx = db.transaction(names, 'readonly');
    const all = await Promise.all(names.map(name => new Promise<Record<string, unknown>[]>((resolve, reject) => { const r = tx.objectStore(name).getAll(); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); })));
    db.close();
    for (const rows of all) for (const row of rows) if (row.blob instanceof Blob) row.blob = { type: row.blob.type, bytes: [...new Uint8Array(await row.blob.arrayBuffer())] };
    return { version: db.version, data: Object.fromEntries(names.map((name, i) => [name, all[i]])) };
  });
}
for (const abort of [false, true]) test(`DATA-04 all stores and PDF bytes survive migration ${abort ? 'abort' : 'success'}`, async ({ page }) => {
  const pdf = await PDFDocument.create(); pdf.addPage([400, 300]).drawText('Migration PDF fixture');
  const bytes = await pdf.save(), hash = createHash('sha256').update(bytes).digest('hex');
  await page.route('**/__migration_fixture', r => r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>fixture</title>' }), { times: 1 });
  await page.goto('/__migration_fixture');
  await page.evaluate(async ({ bytes, hash }) => {
    const r = indexedDB.open('my-note-app', 1);
    r.onupgradeneeded = () => { for (const name of ['folders', 'notebooks', 'pages', 'attachments', 'meta']) r.result.createObjectStore(name, { keyPath: 'id' }); };
    const db = await new Promise<IDBDatabase>(resolve => { r.onsuccess = () => resolve(r.result); });
    const now = '2026-09-09T00:00:00.000Z', tx = db.transaction(['folders', 'notebooks', 'pages', 'attachments', 'meta'], 'readwrite');
    tx.objectStore('folders').put({ id: 'f', parentId: null, name: '移行フォルダ', createdAt: now, updatedAt: now, deletedAt: null });
    tx.objectStore('notebooks').put({ id: 'n', folderId: 'f', title: '移行PDF', pageIds: ['p'], revision: 3, createdAt: now, updatedAt: now, deletedAt: null });
    tx.objectStore('pages').put({ id: 'p', notebookId: 'n', widthPt: 400, heightPt: 300, revision: 2, background: { kind: 'plain', color: '#ffffff' },
      pdfSource: { attachmentId: 'a', pageIndex: 0, rotation: 0, viewBox: [0, 0, 400, 300] }, elements: [{ id: 'stroke', type: 'stroke', tool: 'pen', color: '#123456', widthPt: 3, points: [{ x: 25, y: 30, p: .8 }] }] });
    tx.objectStore('attachments').put({ id: 'a', mimeType: 'application/pdf', size: bytes.length, sha256: hash, blob: new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }) });
    tx.objectStore('meta').put({ id: 'fixture-setting', value: { preserved: true } });
    await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error); }); db.close();
  }, { bytes: [...bytes], hash });
  const before = await records(page);
  if (abort) await page.addInitScript(() => {
    const create = IDBObjectStore.prototype.createIndex;
    IDBObjectStore.prototype.createIndex = function (...args) { const index = create.apply(this, args); if (args[0] === 'byNotebook') this.transaction.abort(); return index; };
  });
  await page.goto('/#note=n');
  if (abort) await expect(page.getByRole('alert')).toContainText('保存形式の更新に失敗');
  else { await expect(page.getByTestId('pdf-status')).toHaveText('PDF表示済み'); await expect(page.getByTestId('stroke-count')).toHaveText('1筆'); }
  const after = await records(page);
  expect(after.data).toEqual(before.data); expect(after.version).toBe(abort ? 1 : 2);
});
