import 'fake-indexeddb/auto';
import { afterEach, expect, it, vi } from 'vitest';
import { Repository } from '../../src/storage/repository';
import type { NoteSnapshot } from '../../src/domain/notebook';
const opened: Repository[] = [];
afterEach(() => { for (const db of opened) db.close(); opened.length = 0; });
async function open(name = crypto.randomUUID()) { const db = await Repository.open(name); opened.push(db); return db; }
function fixture(): NoteSnapshot {
  return { notebook: { id: 'n1', folderId: null, title: '会議メモ', pageIds: ['p1'], revision: 0, createdAt: '2026-09-06T00:00:00.000Z', updatedAt: '2026-09-06T00:00:00.000Z', deletedAt: null },
    pages: [{ id: 'p1', notebookId: 'n1', widthPt: 595.28, heightPt: 841.89, background: { kind: 'plain', color: '#ffffff' }, elements: [], revision: 0 }] };
}
it('XFER-04 既にabortされたtransactionの元の失敗を再abortで隠さず全追加を戻す', async () => {
  const db = await open(); await db.create(fixture()); const before = await db.snapshot();
  const next = fixture(); next.notebook.id = 'n2'; next.notebook.pageIds = ['p2']; next.pages[0].id = 'p2'; next.pages[0].notebookId = 'n2';
  const original = IDBObjectStore.prototype.add;
  const spy = vi.spyOn(IDBObjectStore.prototype, 'add').mockImplementation(function (this: IDBObjectStore, ...args) {
    const result = original.apply(this, args);
    if (this.name === 'pages') this.transaction.abort();
    return result;
  });
  try { await expect(db.importSnapshot({ folders: [], notebooks: [next.notebook], pages: next.pages, attachments: [] })).rejects.toMatchObject({ name: 'AbortError' }); }
  finally { spy.mockRestore(); }
  expect(await db.snapshot()).toEqual(before);
});
it('DATA-01 ノートと全ページを保存し接続を開き直して復元する', async () => {
  const name = crypto.randomUUID(), db = await open(name), note = fixture();
  await db.create(note); db.close();
  expect(await (await open(name)).load('n1')).toEqual(note);
});
it('NOTE-01 一覧はノートのメタデータのみ返す。不明IDはundefined', async () => {
  const db = await open(), note = fixture(); await db.create(note);
  expect(await db.list()).toEqual([note.notebook]); expect(await db.load('missing')).toBeUndefined();
});
it('DATA-03 同じrevisionからの2接続の保存は片方を競合として拒否する', async () => {
  const name = crypto.randomUUID(), a = await open(name), b = await open(name), note = fixture();
  await a.create(note);
  const next = structuredClone(note); next.notebook.title = '新しいタイトル'; next.notebook.revision = 1; next.pages[0].revision = 1;
  await a.save(next, 0);
  const stale = structuredClone(next); stale.notebook.title = '古い編集';
  await expect(b.save(stale, 0)).rejects.toThrow('競合');
  expect(await a.load('n1')).toEqual(next);
});
it('DATA-02 重複IDの作成は全体を中止し既存データを保持', async () => {
  const db = await open(), note = fixture(); await db.create(note);
  const duplicate = fixture(); duplicate.notebook.id = 'n2'; duplicate.pages[0].notebookId = 'n2';
  await expect(db.create(duplicate)).rejects.toThrow();
  expect(await db.load('n2')).toBeUndefined(); expect(await db.load('n1')).toEqual(note);
});
it('DATA-03 revision飛ばし、不明ノート、ページ参照不一致の保存を拒否する', async () => {
  const db = await open(), note = fixture(); await db.create(note);
  await expect(db.save(note, 0)).rejects.toThrow('revision');
  const bad = fixture(); bad.notebook.revision = 1; bad.pages[0].notebookId = '別のノート';
  await expect(db.save(bad, 0)).rejects.toThrow('ページ');
  bad.pages[0].notebookId = 'n1'; bad.notebook.id = 'missing';
  await expect(db.save(bad, 0)).rejects.toThrow();
  expect(await db.load('n1')).toEqual(note);
});

it('NOTE-02 フォルダの作成・改名・移動を保存し不正な循環移動をabort', async () => {
  const db = await open();
  const a = { id: 'a', parentId: null, name: ' 親 ', createdAt: '', updatedAt: '', deletedAt: null };
  await db.addFolder(a); await db.addFolder({ ...a, id: 'b', parentId: 'a', name: '子' });
  await db.renameFolder('b', ' 子の名前 ');
  expect((await db.listFolders()).find(f => f.id === 'b')!.name).toBe('子の名前');
  const before = await db.listFolders();
  await expect(db.moveFolder('a', 'b')).rejects.toThrow('循環');
  expect(await db.listFolders()).toEqual(before);
  await db.moveFolder('b', null);
  expect((await db.listFolders()).find(f => f.id === 'b')!.parentId).toBeNull();
});
it('NOTE-02/DATA-03 ノート移動はrevisionを増やし古い編集と不明な親を拒否', async () => {
  const db = await open(), note = fixture(); await db.create(note);
  await db.addFolder({ id: 'f', parentId: null, name: '会議', createdAt: '', updatedAt: '', deletedAt: null });
  await db.moveNotebook('n1', 'f', 0);
  const moved = (await db.load('n1'))!;
  expect(moved.notebook.folderId).toBe('f'); expect(moved.notebook.revision).toBe(1);
  await expect(db.moveNotebook('n1', null, 0)).rejects.toThrow('競合');
  await expect(db.moveNotebook('n1', 'missing', 1)).rejects.toThrow('フォルダ');
  expect(await db.load('n1')).toEqual(moved);
  await db.moveNotebook('n1', null, 1);
  expect((await db.load('n1'))!.notebook.folderId).toBeNull();
});

it('NOTE-04 フォルダ削除と復元は所属ノートと子孫を一括で保存', async () => {
  const db = await open();
  await db.addFolder({ id: 'f', parentId: null, name: '親', createdAt: '', updatedAt: '', deletedAt: null });
  await db.addFolder({ id: 'child', parentId: 'f', name: '子', createdAt: '', updatedAt: '', deletedAt: null });
  const note = fixture(); note.notebook.folderId = 'child'; await db.create(note);
  await db.trash('folder', 'f');
  expect((await db.listFolders()).every(f => !!f.deletedAt)).toBe(true);
  expect((await db.load('n1'))!.notebook.deletedAt).not.toBeNull();
  await db.restore('folder', 'child');
  expect((await db.listFolders()).find(f => f.id === 'child')!.parentId).toBeNull();
  expect((await db.load('n1'))!.notebook.deletedAt).toBeNull();
});
it('NOTE-04 ノート単独削除・復元と生存データの完全削除禁止', async () => {
  const db = await open(); await db.create(fixture());
  await expect(db.purge('notebook', 'n1')).rejects.toThrow('ゴミ箱');
  await db.trash('notebook', 'n1');
  expect((await db.load('n1'))!.notebook.deletedAt).not.toBeNull();
  await db.restore('notebook', 'n1'); expect((await db.load('n1'))!.notebook.deletedAt).toBeNull();
  await db.trash('notebook', 'n1'); await db.purge('notebook', 'n1');
  expect(await db.load('n1')).toBeUndefined();
  await expect(db.trash('notebook', 'missing')).rejects.toThrow();
});
it('NOTE-04 完全削除は共有添付を残し、最後の参照がなくなった時だけ消す', async () => {
  const name = crypto.randomUUID(), db = await open(name);
  for (const id of ['a', 'b']) {
    const note = fixture(); note.notebook.id = id; note.notebook.pageIds = [id]; note.pages[0].id = id; note.pages[0].notebookId = id;
    note.pages[0].pdfSource = { attachmentId: 'shared', pageIndex: 0, rotation: 0, viewBox: [0, 0, 595, 842] };
    await db.create(note);
  }
  const request = indexedDB.open(name);
  const raw = await new Promise<IDBDatabase>(resolve => { request.onsuccess = () => resolve(request.result); });
  await new Promise<void>(resolve => { const tx = raw.transaction('attachments', 'readwrite'); tx.objectStore('attachments').put({ id: 'shared', blob: new Blob(['synthetic']) }); tx.oncomplete = () => resolve(); });
  const count = () => new Promise<number>(resolve => { const operation = raw.transaction('attachments').objectStore('attachments').count(); operation.onsuccess = () => resolve(operation.result); });
  await db.trash('notebook', 'a'); await db.purge('notebook', 'a'); expect(await count()).toBe(1);
  await db.trash('notebook', 'b'); await db.purge('notebook', 'b'); expect(await count()).toBe(0); raw.close();
});

it('XFER-02/04 ライブラリーsnapshotと一括追加、重複時は全追加をabort', async () => {
  const source = await open(), destination = await open(); await source.create(fixture());
  const snapshot = await source.snapshot(); expect(snapshot.notebooks).toHaveLength(1); expect(snapshot.pages).toHaveLength(1);
  await destination.importSnapshot(snapshot); expect(await destination.load('n1')).toEqual(fixture());
  const collision = structuredClone(snapshot);
  collision.folders.push({ id: 'new-folder', parentId: null, name: '半端に残さない', createdAt: '', updatedAt: '', deletedAt: null });
  await expect(destination.importSnapshot(collision)).rejects.toThrow();
  expect(await destination.listFolders()).toEqual([]); expect(await destination.snapshot()).toEqual(snapshot);
});

it('DATA-03 indexed ownership check accepts new pages and atomically rejects another notebook page', async () => {
  const db = await open(); await db.create(fixture());
  const other = fixture(); other.notebook.id = 'other'; other.notebook.pageIds = ['foreign']; other.pages[0].id = 'foreign'; other.pages[0].notebookId = 'other';
  await db.create(other);
  const next = fixture(); next.notebook.revision = 1;
  next.notebook.pageIds.push('new'); next.pages.push({ ...next.pages[0], id: 'new' });
  await db.save(next, 0); expect(await db.load('n1')).toEqual(next);
  const before = await db.snapshot();
  const bad = structuredClone(next); bad.notebook.revision = 2; bad.pages[0].background.kind = 'grid';
  bad.notebook.pageIds.push('foreign'); bad.pages.push({ ...next.pages[0], id: 'foreign' });
  await expect(db.save(bad, 1)).rejects.toThrow('別のノート');
  expect(await db.snapshot()).toEqual(before);
});
