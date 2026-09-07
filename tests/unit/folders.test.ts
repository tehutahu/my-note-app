import { expect, it } from 'vitest';
import { createFolder, moveFolder, renameFolder, type Folder } from '../../src/domain/folders';
const folder = (id: string, parentId: string | null = null): Folder => ({ id, parentId, name: id, createdAt: '2026-09-07T00:00:00Z', updatedAt: '2026-09-07T00:00:00Z', deletedAt: null });
it('NOTE-02 100フォルダと20階層を作成し正常移動を保持する', () => {
  let tree: Folder[] = [];
  for (let i = 0; i < 100; i++) tree = createFolder(tree, folder(String(i), i > 0 && i < 20 ? String(i - 1) : null));
  expect(tree).toHaveLength(100);
  const moved = moveFolder(tree, '99', '0'); expect(moved.find(f => f.id === '99')!.parentId).toBe('0');
  expect(tree.find(f => f.id === '99')!.parentId).toBeNull();
  expect(moveFolder(moved, '99', null).find(f => f.id === '99')!.parentId).toBeNull();
});
it('NOTE-02 循環・21階層・不明親・重複IDは元ツリーを変更せず拒否する', () => {
  const tree = Array.from({ length: 20 }, (_, i) => folder(String(i), i ? String(i - 1) : null));
  const before = structuredClone(tree);
  expect(() => moveFolder(tree, '0', '19')).toThrow('循環');
  expect(() => moveFolder(tree, '0', '0')).toThrow('循環');
  expect(() => createFolder(tree, folder('new', '19'))).toThrow('20階層');
  expect(() => createFolder(tree, folder('new', 'missing'))).toThrow('親');
  expect(() => createFolder(tree, folder('0'))).toThrow('重複');
  expect(() => moveFolder(tree, 'missing', null)).toThrow('見つかりません');
  expect(tree).toEqual(before);
});
it('NOTE-02 子孫を含めて深さを検証し、削除済みの親を拒否する', () => {
  const tree = Array.from({ length: 20 }, (_, i) => folder(String(i), i ? String(i - 1) : null));
  tree.push(folder('branch'), folder('child', 'branch'));
  expect(() => moveFolder(tree, 'branch', '18')).toThrow('20階層');
  expect(() => createFolder([{ ...folder('deleted'), deletedAt: '2026-09-07' }], folder('new', 'deleted'))).toThrow('親');
});
it('NOTE-02 名前をtrimし1〜120文字に制限。同名は許可する', () => {
  const tree = [folder('a'), folder('b')];
  expect(renameFolder(tree, 'a', '  会議  ')[0].name).toBe('会議');
  expect(createFolder(tree, { ...folder('c'), name: ' a ' })[2].name).toBe('a');
  expect(renameFolder(tree, 'a', 'あ'.repeat(120))[0].name).toHaveLength(120);
  for (const name of ['', '  ', 'あ'.repeat(121)]) expect(() => renameFolder(tree, 'a', name)).toThrow('1〜120');
  expect(() => renameFolder(tree, 'missing', '名前')).toThrow('見つかりません');
});
