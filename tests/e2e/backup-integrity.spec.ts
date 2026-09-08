import { expect, test, type Page } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import type { Backup } from '../../src/transfer/backup';
const id = (n: number) => `00000000-0000-4000-8000-${n.toString(16).padStart(12, '0')}`;
async function fixture(size?: number): Promise<Backup> {
  const pdf = await PDFDocument.create(); pdf.addPage([400, 300]).drawText('Backup roundtrip sample');
  const raw = await pdf.save(), bytes = size ? Buffer.alloc(size, 32) : Buffer.from(raw); if (size) bytes.set(raw);
  const now = '2026-09-08T00:00:00.000Z';
  return { format: 'my-note-app', schemaVersion: 1, scope: 'library', exportedAt: now,
    folders: [],
    notebooks: [{ id: id(1), folderId: null, title: 'PDFバックアップ', pageIds: [id(2)], revision: 0, createdAt: now, updatedAt: now, deletedAt: null }],
    pages: [{ id: id(2), notebookId: id(1), widthPt: 400, heightPt: 300, revision: 0, elements: [], background: { kind: 'plain', color: '#ffffff' }, pdfSource: { attachmentId: id(3), pageIndex: 0, rotation: 0, viewBox: [0, 0, 400, 300] } }],
    attachments: [{ id: id(3), mimeType: 'application/pdf', size: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), dataBase64: bytes.toString('base64') }] };
}
async function exportFile(page: Page, name = '全体バックアップを書き出す'): Promise<Backup> {
  const event = page.waitForEvent('download'); await page.getByRole('button', { name, exact: true }).click();
  return JSON.parse(await readFile((await (await event).path())!, 'utf8')) as Backup;
}
function logical(backup: Backup) {
  const folders = [...backup.folders].sort((a, b) => a.name.localeCompare(b.name));
  const notebooks = [...backup.notebooks].sort((a, b) => a.title.localeCompare(b.title));
  const pages = notebooks.flatMap(note => note.pageIds.map(id => backup.pages.find(page => page.id === id)!));
  const attachments = [...backup.attachments].sort((a, b) => a.sha256.localeCompare(b.sha256));
  const ids = new Map([...folders, ...notebooks, ...pages, ...attachments, ...pages.flatMap(page => page.elements)].map((record, i) => [record.id, `id${i}`]));
  return JSON.parse(JSON.stringify({ folders, notebooks, pages, attachments }, (_key, value) => typeof value === 'string' && ids.has(value) ? ids.get(value) : value));
}
async function importFile(page: Page, backup: Backup) {
  await page.getByLabel('バックアップを読み込む', { exact: true }).setInputFiles({ name: 'roundtrip.snote', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
}
test('XFER-03 20MiB PDF backup is restored and renders with the original hash', async ({ page }) => {
  test.setTimeout(90000);
  const backup = await fixture(20 * 1024 * 1024), path = '/workspace/artifacts/backup-20m.snote';
  await writeFile(path, JSON.stringify(backup));
  await page.goto('/');
  await page.getByLabel('バックアップを読み込む', { exact: true }).setInputFiles(path);
  await page.getByRole('button', { name: 'PDFバックアップ', exact: true }).click();
  await expect(page.getByTestId('pdf-status')).toHaveText('PDF表示済み', { timeout: 30000 });
  const event = page.waitForEvent('download');
  await page.getByRole('button', { name: 'このノートを書き出す', exact: true }).click();
  const downloaded = await event;
  const result = JSON.parse(await readFile((await downloaded.path())!, 'utf8')) as Backup;
  expect(result.attachments[0].sha256).toBe(backup.attachments[0].sha256);
  expect(result.attachments[0].dataBase64).toBe(backup.attachments[0].dataBase64);
  expect(result.attachments[0].id).not.toBe(backup.attachments[0].id);
  expect(result.pages[0].pdfSource!.attachmentId).toBe(result.attachments[0].id);
});

test('XFER-03 rejected backup clears the in-progress state and retains existing data', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'ノートを作る', exact: true }).click();
  await page.getByRole('button', { name: 'ノート一覧', exact: true }).click();
  await page.getByLabel('バックアップを読み込む', { exact: true }).setInputFiles({ name: 'broken.snote', mimeType: 'application/json', buffer: Buffer.from('{broken') });
  await expect(page.getByRole('alert')).toContainText('JSON');
  await expect(page.locator('#import-status')).toHaveText('取り込みに失敗しました');
  await expect(page.getByRole('button', { name: 'はじめてのノート', exact: true })).toHaveCount(1);
  await expect(page.getByLabel('バックアップを読み込む', { exact: true })).toBeEnabled();
});

test('XFER-01 PDF and three folder levels survive isolated-storage roundtrip and editing', async ({ page, browser, baseURL }) => {
  const backup = await fixture(), now = backup.exportedAt;
  backup.folders = [0, 1, 2].map(i => ({ id: id(10 + i), parentId: i ? id(9 + i) : null, name: `階層${i + 1}`, createdAt: now, updatedAt: now, deletedAt: null }));
  backup.notebooks[0].folderId = id(12);
  backup.pages[0].elements = [{ id: id(20), type: 'stroke', tool: 'highlighter', color: '#ffcc00', widthPt: 12, points: [{ x: 20, y: 30, p: .2 }, { x: 100, y: 60, p: .8 }] }];
  await page.goto('/'); await importFile(page, backup);
  await expect(page.getByRole('button', { name: 'フォルダ: 階層1', exact: true })).toHaveCount(1);
  const exported = await exportFile(page); expect(logical(exported)).toEqual(logical(backup));
  const otherContext = await browser.newContext({ baseURL });
  try {
    const other = await otherContext.newPage(); await other.goto('/');
    await importFile(other, exported);
    await expect(other.getByRole('button', { name: 'フォルダ: 階層1', exact: true })).toHaveCount(1);
    expect(logical(await exportFile(other))).toEqual(logical(exported));
    for (const name of ['階層1', '階層2', '階層3']) await other.getByRole('button', { name: `フォルダ: ${name}`, exact: true }).click();
    await other.getByRole('button', { name: 'PDFバックアップ', exact: true }).click();
    await expect(other.getByTestId('pdf-status')).toHaveText('PDF表示済み');
    const box = (await other.getByLabel('手書きキャンバス').boundingBox())!;
    await other.mouse.click(box.x + 80, box.y + 80);
    await expect(other.getByTestId('stroke-count')).toHaveText('2筆');
    await expect(other.getByTestId('save-status')).toHaveText('保存済み');
    const edited = await exportFile(other, 'このノートを書き出す');
    expect(edited.attachments[0].sha256).toBe(backup.attachments[0].sha256);
    await importFile(page, edited);
    await expect(page.getByRole('button', { name: 'フォルダ: 階層1', exact: true })).toHaveCount(2);
    const final = await exportFile(page);
    expect(final.notebooks).toHaveLength(2);
    const originalIds = new Set([...exported.folders, ...exported.notebooks, ...exported.pages, ...exported.attachments].map(record => record.id));
    const original: Backup = { ...final, folders: final.folders.filter(f => originalIds.has(f.id)), notebooks: final.notebooks.filter(n => originalIds.has(n.id)), pages: final.pages.filter(p => originalIds.has(p.id)), attachments: final.attachments.filter(a => originalIds.has(a.id)) };
    const restored: Backup = { ...final, folders: final.folders.filter(f => !originalIds.has(f.id)), notebooks: final.notebooks.filter(n => !originalIds.has(n.id)), pages: final.pages.filter(p => !originalIds.has(p.id)), attachments: final.attachments.filter(a => !originalIds.has(a.id)) };
    expect(logical(original)).toEqual(logical(exported));
    expect(logical(restored)).toEqual(logical(edited));
  } finally { await otherContext.close(); }
});

test('XFER-03 invalid reference, hash, base64, version and PDF fixtures leave the database unchanged', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'ノートを作る', exact: true }).click();
  await page.getByRole('button', { name: 'ノート一覧', exact: true }).click();
  const before = await exportFile(page), source = await fixture();
  const cases: Array<[string, (backup: Backup) => void]> = [
    ['形式', b => { Object.assign(b, { format: 'other' }); }],
    ['バージョン', b => { Object.assign(b, { schemaVersion: 2 }); }],
    ['参照', b => { b.notebooks[0].pageIds = [id(99)]; }],
    ['循環', b => { b.folders = [{ id: id(4), parentId: id(4), name: '循環', createdAt: b.exportedAt, updatedAt: b.exportedAt, deletedAt: null }]; }],
    ['数値', b => { b.pages[0].elements = [{ id: id(4), type: 'stroke', tool: 'pen', color: '#000000', widthPt: 3, points: [{ x: Infinity, y: 0, p: .8 }] }]; }],
    ['SHA-256', b => { b.attachments[0].sha256 = '0'.repeat(64); }],
    ['base64', b => { b.attachments[0].dataBase64 = '@' + b.attachments[0].dataBase64.slice(1); }],
    ['サイズ', b => { b.attachments[0].size += 1; }],
    ['PDFページ', b => { b.pages[0].pdfSource!.pageIndex = 100; }],
    ['重複', b => { b.pages[0].id = b.notebooks[0].id; }],
    ['PDF', b => { const bytes = Buffer.from('broken PDF'); b.attachments[0] = { ...b.attachments[0], size: bytes.length, dataBase64: bytes.toString('base64'), sha256: createHash('sha256').update(bytes).digest('hex') }; }],
  ];
  for (const [reason, mutate] of cases) {
    const bad = structuredClone(source); mutate(bad); await importFile(page, bad);
    await expect(page.getByRole('alert')).toContainText(reason);
    await expect(page.locator('#import-status')).toHaveText('取り込みに失敗しました');
    expect(logical(await exportFile(page)), reason).toEqual(logical(before));
  }
});

test('XFER-04 abort and quota failure roll back the entire import, cancellation adds nothing', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'ノートを作る', exact: true }).click();
  await page.getByRole('button', { name: 'ノート一覧', exact: true }).click();
  const before = await exportFile(page), source = await fixture();
  source.folders = [0, 1, 2].map(i => ({ id: id(10 + i), parentId: i ? id(9 + i) : null, name: `原子性${i}`, createdAt: source.exportedAt, updatedAt: source.exportedAt, deletedAt: null }));
  source.notebooks[0].folderId = id(12);
  for (const mode of ['abort', 'attachment-abort', 'quota']) {
    await page.evaluate(mode => {
      const add = IDBObjectStore.prototype.add;
      IDBObjectStore.prototype.add = function (...args) {
        if (this.name === (mode === 'attachment-abort' ? 'attachments' : 'pages')) {
          IDBObjectStore.prototype.add = add;
          if (mode === 'quota') throw new DOMException('fixture quota', 'QuotaExceededError');
          const request = add.apply(this, args); this.transaction.abort(); return request;
        }
        return add.apply(this, args);
      };
    }, mode);
    await importFile(page, source);
    await expect(page.locator('#import-status')).toHaveText('取り込みに失敗しました');
    await expect(page.getByRole('alert')).toContainText(mode === 'quota' ? '容量' : '取り込み');
    expect(logical(await exportFile(page)), mode).toEqual(logical(before));
  }
  await page.evaluate(() => {
    const digest = crypto.subtle.digest.bind(crypto.subtle);
    crypto.subtle.digest = async (...args) => {
      crypto.subtle.digest = digest;
      const result = await digest(...args);
      await new Promise<void>(resolve => { Object.assign(window, { releaseHash: resolve }); });
      return result;
    };
  });
  await importFile(page, source);
  await page.waitForFunction(() => 'releaseHash' in window);
  await page.getByRole('button', { name: '取り込みをキャンセル', exact: true }).click();
  await expect(page.locator('#import-status')).toHaveText('キャンセルしました');
  await page.evaluate(() => { (window as unknown as { releaseHash: () => void }).releaseHash(); });
  await expect(page.getByLabel('バックアップを読み込む', { exact: true })).toBeEnabled();
  expect(logical(await exportFile(page))).toEqual(logical(before));
});
