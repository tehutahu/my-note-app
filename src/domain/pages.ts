import type { Page } from './notebook';
export function addPage(pages: Page[], page: Page): Page[] {
  if (pages.some(p => p.id === page.id)) throw new Error('ページIDが重複しています');
  return [...pages, page];
}
export function movePage(pages: Page[], id: string, index: number): Page[] {
  if (!Number.isInteger(index) || index < 0 || index >= pages.length) throw new Error('移動先の位置が不正です');
  const page = pages.find(p => p.id === id);
  if (!page) throw new Error('ページが見つかりません');
  const next = pages.filter(p => p.id !== id); next.splice(index, 0, page); return next;
}
export function removePage(pages: Page[], id: string): Page[] {
  if (pages.length === 1) throw new Error('最後の1ページは削除できません');
  if (!pages.some(p => p.id === id)) throw new Error('ページが見つかりません');
  return pages.filter(p => p.id !== id);
}
