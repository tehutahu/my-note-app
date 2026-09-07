import { expect, it } from 'vitest';
import { trashFolder, restoreFolder, type LibraryMetadata } from '../../src/domain/trash';
const fixture = (): LibraryMetadata => ({
  folders: ['a', 'b', 'c'].map((id, i) => ({ id, parentId: i === 1 ? 'a' : null, name: id, createdAt: '', updatedAt: '', deletedAt: null })),
  notebooks: ['a', 'b', 'c'].map(id => ({ id: 'n' + id, folderId: id, title: id, pageIds: ['p' + id], revision: 0, createdAt: '', updatedAt: '', deletedAt: null })),
});
it('NOTE-04 フォルダと子孫・所属ノートを一括ゴミ箱へ移し復元する', () => {
  const initial = fixture(), deleted = trashFolder(initial, 'a', '2026-09-07T00:00:00Z');
  expect(deleted.folders.map(f => !!f.deletedAt)).toEqual([true, true, false]);
  expect(deleted.notebooks.map(n => !!n.deletedAt)).toEqual([true, true, false]);
  expect(initial.folders.every(f => f.deletedAt === null)).toBe(true);
  expect(deleted.notebooks[0].revision).toBe(1);
  const restored = restoreFolder(deleted, 'a', '2026-09-07T01:00:00Z');
  expect(restored.folders.every(f => f.deletedAt === null)).toBe(true);
  expect(restored.notebooks.every(n => n.deletedAt === null)).toBe(true);
  expect(restored.folders[1].parentId).toBe('a'); expect(restored.notebooks[1].revision).toBe(2);
});
it('NOTE-04 親が存在しない/削除済みならルートへ復元する', () => {
  const deleted = trashFolder(fixture(), 'b', 'deleted');
  deleted.folders = deleted.folders.filter(f => f.id !== 'a');
  expect(restoreFolder(deleted, 'b', 'restored').folders[0].parentId).toBeNull();
  const other = trashFolder(fixture(), 'a', 'deleted');
  expect(restoreFolder(other, 'b', 'restored').folders[1].parentId).toBeNull();
});
it('NOTE-04 先に別操作で捨てた子は親の復元で勝手に戻さない', () => {
  const first = trashFolder(fixture(), 'b', 'first');
  const second = trashFolder(first, 'a', 'second');
  const restored = restoreFolder(second, 'a', 'restored');
  expect(restored.folders[1].deletedAt).toBe('first');
  expect(restored.notebooks[1].deletedAt).toBe('first');
  expect(() => trashFolder(fixture(), 'missing', 'now')).toThrow('見つかりません');
  expect(() => restoreFolder(fixture(), 'a', 'now')).toThrow('ゴミ箱');
});
