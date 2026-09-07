import 'fake-indexeddb/auto';
import { expect, test, vi } from 'vitest';
import { Repository } from '../../src/storage/repository';
function request<T>(operation: IDBRequest<T>): Promise<T> { return new Promise((resolve,reject) => { operation.onsuccess = () => resolve(operation.result); operation.onerror = () => reject(operation.error); }); }
async function legacy(name: string, version = 1) {
  const op = indexedDB.open(name, version);
  op.onupgradeneeded = () => { for (const name of ['folders','notebooks','pages','attachments','meta']) op.result.createObjectStore(name, { keyPath: 'id' }); };
  const db = await request(op), tx = db.transaction(['notebooks','pages'], 'readwrite');
  tx.objectStore('notebooks').put({ id: 'note', title: '移行前', pageIds: ['second','first'], revision: 3 });
  for (const id of ['first','second']) tx.objectStore('pages').put({ id, notebookId: 'note', elements: [{ id: 'stroke-' + id, points: [{ x: 12, y: 23, p: .8 }] }] });
  await new Promise<void>(resolve => { tx.oncomplete = () => resolve(); }); return db;
}
test('DATA-04 schema1のノート・点・ページ順を保持してschema2へ移行する', async () => {
  const name = crypto.randomUUID(), old = await legacy(name); old.close();
  const db = await Repository.open(name);
  expect((await db.load('note'))!.pages.map(p => p.id)).toEqual(['second','first']);
  expect((await db.load('note'))!.pages[0].elements[0]).toEqual({ id: 'stroke-second', points: [{ x: 12, y: 23, p: .8 }] }); db.close();
  const raw = await request(indexedDB.open(name)); expect(raw.version).toBe(2);
  expect(raw.transaction('pages').objectStore('pages').indexNames.contains('byNotebook')).toBe(true); raw.close();
});
test('DATA-04 migration途中abortなら旧versionとデータを保持して再試行できる', async () => {
  const name = crypto.randomUUID(), old = await legacy(name); old.close();
  const create = IDBObjectStore.prototype.createIndex;
  const spy = vi.spyOn(IDBObjectStore.prototype, 'createIndex').mockImplementation(function (this: IDBObjectStore, ...args) { const index = create.apply(this,args); this.transaction.abort(); return index; });
  try { await expect(Repository.open(name)).rejects.toThrow('更新'); } finally { spy.mockRestore(); }
  const raw = await request(indexedDB.open(name)); expect(raw.version).toBe(1);
  expect(raw.transaction('pages').objectStore('pages').indexNames.contains('byNotebook')).toBe(false);
  expect((await request(raw.transaction('notebooks').objectStore('notebooks').get('note'))).revision).toBe(3); raw.close();
  const recovered = await Repository.open(name); expect((await recovered.load('note'))!.pages).toHaveLength(2); recovered.close();
});
test('DATA-04 旧接続でblockedなら閉じるタブを案内し、裏で勝手に移行しない', async () => {
  const name = crypto.randomUUID(), old = await legacy(name);
  try { await expect(Repository.open(name)).rejects.toThrow('別のタブ'); } finally { old.close(); }
  const raw = await request(indexedDB.open(name)); expect(raw.version).toBe(1); raw.close();
  const recovered = await Repository.open(name); recovered.close();
});
test('DATA-04 新しいschemaを旧コードで開いてもDBを削除しない', async () => {
  const name = crypto.randomUUID(), newer = await legacy(name,3); newer.close();
  await expect(Repository.open(name)).rejects.toThrow('新しい保存形式');
  const raw = await request(indexedDB.open(name)); expect(raw.version).toBe(3); expect(await request(raw.transaction('pages').objectStore('pages').count())).toBe(2); raw.close();
});
