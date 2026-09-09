import { expect, test, type Page } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { fixtureNote, fixturePdf } from '../fixtures/performance';
import type { NoteSnapshot } from '../../src/domain/notebook';
async function seed(page: Page, note: NoteSnapshot) {
  await page.evaluate(async note => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('my-note-app');
      request.onsuccess = () => {
        const db = request.result, tx = db.transaction(['notebooks', 'pages'], 'readwrite');
        tx.objectStore('notebooks').put(note.notebook);
        for (const p of note.pages) tx.objectStore('pages').put(p);
        tx.oncomplete = () => { db.close(); resolve(); }; tx.onabort = () => reject(tx.error);
      }; request.onerror = () => reject(request.error);
    });
  }, note);
}
async function start(page: Page) {
  await page.getByRole('button', { name: '動作の計測', exact: true }).click();
  await page.getByRole('button', { name: '計測を開始', exact: true }).click();
  await page.getByRole('button', { name: '閉じる', exact: true }).click();
}
async function report(page: Page, name: string) {
  await page.getByRole('button', { name: '動作の計測', exact: true }).click();
  await page.getByRole('button', { name: '計測を停止', exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: '計測結果を書き出す', exact: true }).click();
  const raw = await readFile((await (await download).path())!, 'utf8');
  await writeFile(`/workspace/artifacts/PERF-${name}.json`, raw);
  return JSON.parse(raw).measurements;
}
test('PERF-01/03 S 2000 strokes, 100 shapes, 1000 timed samples and 10 saves', async ({ page }) => {
  await page.goto('/'); await expect(page.getByRole('heading', { name: 'ノート一覧', exact: true })).toBeVisible();
  const note = fixtureNote(1, 1, 2000, 100, 100); await seed(page, note);
  await page.goto(`/#note=${note.notebook.id}`); await page.reload();
  await expect(page.getByTestId('element-count')).toHaveText('2100要素');
  const box = (await page.locator('#ink').boundingBox())!; await page.mouse.click(box.x + 20, box.y + 20);
  await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  await start(page);
  const elapsed = await page.locator('#ink').evaluate(async el => {
    const started = performance.now(), rect = el.getBoundingClientRect();
    const send = (type: string, x: number, buttons: number) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType: 'pen', pointerId: 7, button: type === 'pointermove' ? -1 : 0, buttons,
      clientX: rect.left + x, clientY: rect.top + 80, pressure: buttons ? .8 : 0 }));
    for (let stroke = 0; stroke < 10; stroke++) {
      send('pointerdown', 40, 1);
      for (let point = 0; point < 100; point++) { send('pointermove', 40 + point, 1); await new Promise(resolve => setTimeout(resolve, 10)); }
      send('pointerup', 140, 0);
      while (document.querySelector('[data-testid=save-status]')!.textContent !== '保存済み') await new Promise(resolve => setTimeout(resolve, 10));
    }
    return performance.now() - started;
  });
  expect(elapsed).toBeGreaterThanOrEqual(10000);
  await expect(page.getByTestId('stroke-count')).toHaveText('2011筆');
  const data = await report(page, 'S');
  expect(data['input-handler'].totalCount).toBeGreaterThanOrEqual(1000);
  expect(data['input-handler'].p95Ms).toBeLessThanOrEqual(32);
  expect(data['save-start'].totalCount).toBe(10);
  expect(Math.max(...data['save-start'].samples.map((s: { durationMs: number }) => s.durationMs))).toBeLessThanOrEqual(300);
  expect(data['save-commit'].medianMs).toBeLessThanOrEqual(1000);
  expect(data['save-commit'].totalFailures).toBe(0);
});
test('PERF-02 L opens 10 warm notebooks without loading other notebook strokes', async ({ page }) => {
  await page.goto('/'); await expect(page.getByRole('heading', { name: 'ノート一覧', exact: true })).toBeVisible();
  // Generate the trusted synthetic fixture inside the browser to avoid transferring
  // five million points through the browser automation protocol during setup.
  await page.addScriptTag({ content: `window.makePerformanceNote = ${fixtureNote.toString()};` });
  await page.evaluate(async () => {
    const make = (window as unknown as { makePerformanceNote: (i: number, p: number, s: number, n: number) => NoteSnapshot }).makePerformanceNote;
    const db = await new Promise<IDBDatabase>((resolve, reject) => { const r = indexedDB.open('my-note-app'); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    try {
      for (let i = 1; i <= 100; i++) {
        const note = make(i, 10, 100, 50);
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(['notebooks', 'pages'], 'readwrite'); tx.objectStore('notebooks').put(note.notebook);
          for (const p of note.pages) tx.objectStore('pages').put(p);
          tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error);
        });
      }
    } finally { db.close(); }
  });
  await page.reload();
  await page.getByRole('button', { name: '合成ノート 1', exact: true }).click();
  await page.getByRole('button', { name: 'ノート一覧', exact: true }).click();
  await start(page);
  for (let i = 1; i <= 10; i++) {
    await page.getByRole('button', { name: `合成ノート ${i}`, exact: true }).click();
    await expect(page.getByTestId('stroke-count')).toHaveText('100筆');
    await page.getByRole('button', { name: 'ノート一覧', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'ノート一覧', exact: true })).toBeVisible();
  }
  const data = await report(page, 'L');
  expect(data['note-open'].totalCount).toBe(10);
  expect(data['note-open'].medianMs).toBeLessThanOrEqual(1500);
  expect(data['note-open'].totalFailures).toBe(0);
});
test('PERF-04 P imports, switches and exports 20 text/image pages 10 times', async ({ page }) => {
  const buffer = await fixturePdf(); expect(buffer.byteLength).toBeLessThanOrEqual(5 * 1024 * 1024);
  await page.goto('/');
  for (let i = -1; i < 10; i++) {
    if (i === 0) await start(page);
    await page.getByLabel('PDFを取り込む', { exact: true }).setInputFiles({ name: 'P.pdf', mimeType: 'application/pdf', buffer });
    await expect(page.getByTestId('pdf-status')).toHaveText('PDF表示済み');
    await page.getByLabel('ページ選択', { exact: true }).selectOption('1');
    await expect(page.getByTestId('pdf-status')).toHaveText('PDF表示済み');
    const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'PDFを書き出す', exact: true }).click(); await download;
    await page.getByRole('button', { name: 'ノート一覧', exact: true }).click();
  }
  const data = await report(page, 'P');
  for (const [metric, limit] of [['pdf-import', 15000], ['pdf-page', 1500], ['pdf-export', 30000]] as const) {
    expect(data[metric].totalCount).toBeGreaterThanOrEqual(10); expect(data[metric].totalFailures).toBe(0);
    expect(data[metric].medianMs).toBeLessThanOrEqual(limit);
  }
});
