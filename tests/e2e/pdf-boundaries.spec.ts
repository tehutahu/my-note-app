import { expect, test, type Page } from '@playwright/test';
import { PDFDocument, degrees } from 'pdf-lib';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFile } from 'node:fs/promises';
import { encryptedPdf } from '../fixtures/pdf';
async function textPages(bytes: Uint8Array, password?: string): Promise<string[]> {
  const task = getDocument({ data: new Uint8Array(bytes), password, standardFontDataUrl: '/workspace/node_modules/pdfjs-dist/standard_fonts/' });
  try {
    const pdf = await task.promise, text: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i), content = await page.getTextContent();
      text.push(content.items.map(item => 'str' in item ? item.str : '').join(' '));
    }
    return text;
  } finally { await task.destroy(); }
}
async function snapshot(page: Page) {
  return page.evaluate(async () => {
    const open = indexedDB.open('my-note-app'); const db = await new Promise<IDBDatabase>(resolve => { open.onsuccess = () => resolve(open.result); });
    try {
      const tx = db.transaction(['folders', 'notebooks', 'pages', 'attachments'], 'readonly');
      const records = await Promise.all(['folders', 'notebooks', 'pages', 'attachments'].map(store => new Promise<unknown[]>(resolve => { const request = tx.objectStore(store).getAll(); request.onsuccess = () => resolve(request.result); })));
      records[3] = await Promise.all((records[3] as Array<{ blob: Blob }>).map(async a => ({ ...a, actualHash: [...new Uint8Array(await crypto.subtle.digest('SHA-256', await a.blob.arrayBuffer()))].map(n => n.toString(16).padStart(2, '0')).join('') })));
      return records;
    } finally { db.close(); }
  });
}
test('PDF-03 exported annotations preserve selectable source text on every rotation', async ({ page }) => {
  const pdf = await PDFDocument.create(), expected: string[] = [];
  for (const rotation of [0, 90, 180, 270]) { const p = pdf.addPage([400, 300]); p.setRotation(degrees(rotation)); const text = `Selectable text rotation ${rotation}`; p.drawText(text, { x: 20, y: 120, size: 12 }); expected.push(text); }
  await page.goto('/');
  await page.getByLabel('PDFを取り込む', { exact: true }).setInputFiles({ name: 'selectable.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await pdf.save()) });
  await expect(page.getByTestId('pdf-status')).toHaveText('PDF表示済み');
  const box = (await page.getByLabel('手書きキャンバス').boundingBox())!; await page.mouse.click(box.x + 60, box.y + 60);
  const event = page.waitForEvent('download'); await page.getByRole('button', { name: 'PDFを書き出す', exact: true }).click();
  expect(await textPages(await readFile((await (await event).path())!))).toEqual(expected);
});
test('PDF-04 valid 20MiB and 100-page boundaries load, over-limit and unsupported files change nothing', async ({ page }) => {
  test.setTimeout(120000);
  const pdf = await PDFDocument.create(); for (let i = 0; i < 100; i++) pdf.addPage([400, 300]).drawText(`Page ${i + 1}`);
  const padded = Buffer.alloc(20 * 1024 * 1024, 32); padded.set(await pdf.save());
  await page.goto('/');
  await page.getByLabel('PDFを取り込む', { exact: true }).setInputFiles({ name: 'allowed.pdf', mimeType: 'application/pdf', buffer: padded });
  await expect(page.getByLabel('ページ選択', { exact: true }).locator('option')).toHaveCount(100);
  await expect(page.getByTestId('pdf-status')).toHaveText('PDF表示済み');
  await page.getByRole('button', { name: 'ノート一覧', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'ノート一覧', exact: true })).toBeVisible();
  const before = await snapshot(page);
  pdf.addPage([400, 300]);
  const fixtures: Array<[string, Buffer, string]> = [
    ['size-over', Buffer.concat([padded, Buffer.from(' ')]), '20MiB'],
    ['pages-over', Buffer.from(await pdf.save()), '1〜100ページ'],
    ['corrupt', Buffer.from('This is not a PDF'), '取り込めません'],
    ['encrypted', encryptedPdf('review-password'), '暗号化'],
    ['empty-password', encryptedPdf(), '暗号化'],
  ];
  // This valid encrypted file opens without a prompt in PDF.js, but pdf-lib refuses it.
  expect(await textPages(encryptedPdf())).toEqual(['Encrypted fixture text']);
  expect(await textPages(encryptedPdf('review-password'), 'review-password')).toEqual(['Encrypted fixture text']);
  await expect(PDFDocument.load(encryptedPdf())).rejects.toThrow(/encrypted/i);
  for (const [name, buffer, reason] of fixtures) {
    await page.getByLabel('PDFを取り込む', { exact: true }).setInputFiles({ name: `${name}.pdf`, mimeType: 'application/pdf', buffer });
    await expect(page.getByRole('alert')).toContainText(reason);
    await expect(page.getByLabel('PDFを取り込む', { exact: true })).toBeEnabled();
    expect(await snapshot(page), name).toEqual(before);
  }
});
