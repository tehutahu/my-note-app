import { expect, it } from 'vitest';
import { addPage, movePage, removePage } from '../../src/domain/pages';
import type { Page } from '../../src/domain/notebook';
const page = (id: string): Page => ({ id, notebookId: 'n', widthPt: 595.28, heightPt: 841.89, background: { kind: 'plain', color: '#fff' }, elements: [], revision: 0 });
it('NOTE-01 20ページを追加し並べ替え、元配列は保持', () => {
  const original = [page('0')]; let pages = original;
  for (let i = 1; i < 20; i++) pages = addPage(pages, page(String(i)));
  expect(pages).toHaveLength(20); expect(original).toHaveLength(1);
  const moved = movePage(pages, '19', 0);
  expect(moved.map(p => p.id)).toEqual(['19', ...Array.from({ length: 19 }, (_, i) => String(i))]);
  expect(pages[0].id).toBe('0');
  expect(removePage(moved, '19')).toEqual(pages.slice(0, 19));
});
it('NOTE-01 最後の1ページ、不明ID、不正な位置、重複IDを拒否', () => {
  const pages = [page('a'), page('b')];
  expect(() => removePage([page('a')], 'a')).toThrow('最後');
  expect(() => removePage(pages, 'missing')).toThrow('ページ');
  expect(() => movePage(pages, 'missing', 0)).toThrow('ページ');
  for (const index of [-1, 2, .5, NaN]) expect(() => movePage(pages, 'a', index)).toThrow('位置');
  expect(() => addPage(pages, page('a'))).toThrow('重複');
  expect(pages.map(p => p.id)).toEqual(['a', 'b']);
});
