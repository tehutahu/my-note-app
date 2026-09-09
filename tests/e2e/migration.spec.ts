import { expect, test, type Page } from '@playwright/test';
async function seed(page: Page, hold: boolean) {
  await page.route('**/__migration_fixture', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Migration fixture</title>' }), { times: 1 });
  await page.goto('/__migration_fixture');
  await page.evaluate(async hold => {
    const op = indexedDB.open('my-note-app', 1);
    op.onupgradeneeded = () => { for (const name of ['folders','notebooks','pages','attachments','meta']) op.result.createObjectStore(name, { keyPath: 'id' }); };
    const db = await new Promise<IDBDatabase>(resolve => { op.onsuccess = () => resolve(op.result); });
    const tx = db.transaction(['notebooks','pages'], 'readwrite'), now = '2026-09-07T00:00:00.000Z';
    tx.objectStore('notebooks').put({ id: 'old-note', title: '移行前のノート', folderId: null, pageIds: ['old-page'], revision: 0, createdAt: now, updatedAt: now, deletedAt: null });
    tx.objectStore('pages').put({ id: 'old-page', notebookId: 'old-note', widthPt: 595.28, heightPt: 841.89, background: { kind: 'plain', color: '#ffffff' }, revision: 0, elements: [{ id: 'old-stroke', type: 'stroke', tool: 'pen', widthPt: 3, color: '#244f46', points: [{ x: 80, y: 100, p: .8 }] }] });
    await new Promise<void>(resolve => { tx.oncomplete = () => resolve(); });
    if (hold) Object.assign(window, { oldDb: db }); else db.close();
  }, hold);
}
test('DATA-04 旧タブで移行がblockedなら閉じる案内を表示し再起動後の筆跡を保持', async ({ page, context }) => {
  const old = await context.newPage(); await seed(old, true);
  await page.goto('/'); await expect(page.getByRole('alert')).toContainText('別のタブ');
  await old.close(); await page.reload();
  await page.getByRole('button', { name: '移行前のノート', exact: true }).click(); await expect(page.getByTestId('stroke-count')).toHaveText('1筆');
  await page.reload(); await expect(page.getByTestId('stroke-count')).toHaveText('1筆');
});
test('DATA-04 実versionchange transactionをabortして旧DBを保持し再起動で移行できる', async ({ page }) => {
  await seed(page, false);
  await page.addInitScript(() => {
    if (sessionStorage.getItem('migration-aborted')) return;
    const create = IDBObjectStore.prototype.createIndex;
    IDBObjectStore.prototype.createIndex = function (...args) { const index = create.apply(this,args); this.transaction.abort(); sessionStorage.setItem('migration-aborted','1'); return index; };
  });
  await page.goto('/'); await expect(page.getByRole('alert')).toContainText('更新に失敗');
  const version = await page.evaluate(async () => { const op = indexedDB.open('my-note-app'); return new Promise<number>(resolve => { op.onsuccess = () => { const version = op.result.version; op.result.close(); resolve(version); }; }); });
  expect(version).toBe(1);
  await page.reload(); await page.getByRole('button', { name: '移行前のノート', exact: true }).click(); await expect(page.getByTestId('stroke-count')).toHaveText('1筆');
});
test('DATA-04 versionchangeで古いタブの接続を閉じて案内し、未知の新版でもデータを消さない', async ({ page }) => {
  await seed(page, false); await page.goto('/');
  await expect(page.getByRole('button', { name: '移行前のノート', exact: true })).toBeVisible();
  await page.evaluate(async () => {
    const op = indexedDB.open('my-note-app',3);
    await new Promise<void>((resolve,reject) => { op.onsuccess = () => { op.result.close(); resolve(); }; op.onerror = () => reject(op.error); });
  });
  await expect(page.getByRole('alert').filter({ hasText: '保存接続' })).toContainText('保存接続を閉じました');
  await page.reload(); await expect(page.getByRole('alert')).toContainText('新しい保存形式');
  const count = await page.evaluate(async () => {
    const op = indexedDB.open('my-note-app'); const db = await new Promise<IDBDatabase>(resolve => { op.onsuccess = () => resolve(op.result); });
    const query = db.transaction('pages').objectStore('pages').count(); return new Promise<number>(resolve => { query.onsuccess = () => { db.close(); resolve(query.result); }; });
  }); expect(count).toBe(1);
});
