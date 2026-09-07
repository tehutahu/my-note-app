import { expect, it } from 'vitest';
import { encodeBackup, decodeBackup, copyLibrary, type LibrarySnapshot } from '../../src/transfer/backup';
function fixture(): LibrarySnapshot {
  const f = crypto.randomUUID(), n = crypto.randomUUID(), p = crypto.randomUUID();
  const now = '2026-09-07T00:00:00.000Z';
  return { folders: [{ id: f, parentId: null, name: '会議', createdAt: now, updatedAt: now, deletedAt: null }],
    notebooks: [{ id: n, folderId: f, title: 'ノート', pageIds: [p], revision: 0, createdAt: now, updatedAt: now, deletedAt: null }],
    pages: [{ id: p, notebookId: n, widthPt: 595.28, heightPt: 841.89, background: { kind: 'grid', color: '#ffffff' }, elements: [{ id: crypto.randomUUID(), type: 'stroke', tool: 'pen', color: '#123456', widthPt: 3, points: [{ x: 1, y: 2, p: .8 }] }], revision: 0 }], attachments: [] };
}
it('XFER-01/02 バックアップを往復し全参照を独立コピーのIDへ置き換える', async () => {
  const original = fixture(), decoded = await decodeBackup(await encodeBackup(original));
  expect(decoded).toEqual(original);
  const copy = copyLibrary(decoded);
  expect(copy.notebooks[0].id).not.toBe(original.notebooks[0].id);
  expect(copy.pages[0].id).toBe(copy.notebooks[0].pageIds[0]);
  expect(copy.pages[0].notebookId).toBe(copy.notebooks[0].id);
  expect(copy.notebooks[0].folderId).toBe(copy.folders[0].id);
  expect(copy.pages[0].elements[0].id).not.toBe(original.pages[0].elements[0].id);
  expect(copy.notebooks[0].title).toBe(original.notebooks[0].title);
});
it('XFER-03 JSON不正・未来版・循環・参照欠落・不正数値を拒否', async () => {
  await expect(decodeBackup('{broken')).rejects.toThrow();
  const text = await encodeBackup(fixture());
  const edits = [
    (b: Record<string, unknown>) => { b.schemaVersion = 2; },
    (b: Record<string, unknown>) => { b.format = 'other'; },
  ];
  for (const edit of edits) { const b = JSON.parse(text); edit(b); await expect(decodeBackup(JSON.stringify(b))).rejects.toThrow(); }
  for (const key of ['folders', 'notebooks', 'pages']) { const b = JSON.parse(text); b[key] = null; await expect(decodeBackup(JSON.stringify(b))).rejects.toThrow(); }
  const cycle = JSON.parse(text); cycle.folders[0].parentId = cycle.folders[0].id; await expect(decodeBackup(JSON.stringify(cycle))).rejects.toThrow();
  const missing = JSON.parse(text); missing.notebooks[0].pageIds = [crypto.randomUUID()]; await expect(decodeBackup(JSON.stringify(missing))).rejects.toThrow();
  const nan = JSON.parse(text); nan.pages[0].elements[0].points[0].x = null; await expect(decodeBackup(JSON.stringify(nan))).rejects.toThrow();
});
