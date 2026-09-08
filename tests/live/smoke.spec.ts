import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';

test('HTTPS review build opens and retains synthetic notes offline', async ({ page, context, baseURL }) => {
  const failures: string[] = [], external: string[] = [], writes: string[] = [];
  context.on('response', response => { if (response.status() >= 400) failures.push(response.url()); });
  context.on('request', request => {
    if (/^https?:/.test(request.url()) && !request.url().startsWith(baseURL!)) external.push(request.url());
    if (request.method() !== 'GET') writes.push(request.url());
  });
  await page.goto('./');
  await expect(page.getByTestId('offline-status')).toHaveText('オフライン準備完了', { timeout: 60000 });
  expect(process.env.EXPECTED_COMMIT).toMatch(/^[a-f0-9]{7}$/);
  await expect(page.locator('.version')).toContainText(process.env.EXPECTED_COMMIT!);
  await page.screenshot({ path: 'artifacts/https-library.png', fullPage: true });
  const pdf = await PDFDocument.create(); pdf.addPage().drawText('HTTPS synthetic review sample');
  await page.getByLabel('PDFを取り込む', { exact: true }).setInputFiles({ name: 'review-sample.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await pdf.save()) });
  await expect(page.getByTestId('pdf-status')).toHaveText('PDF表示済み');
  await context.setOffline(true); await page.reload();
  await expect(page.getByTestId('pdf-status')).toHaveText('PDF表示済み');
  const canvas = page.getByLabel('手書きキャンバス'); await canvas.scrollIntoViewIfNeeded();
  const box = (await canvas.boundingBox())!;
  await page.mouse.click(box.x + 50, box.y + 50);
  await expect(page.getByTestId('stroke-count')).toHaveText('1筆');
  await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  await page.reload(); await expect(page.getByTestId('stroke-count')).toHaveText('1筆');
  await expect(page.getByTestId('pdf-status')).toHaveText('PDF表示済み');
  for (const name of ['PDFを書き出す', 'このノートを書き出す']) {
    const event = page.waitForEvent('download'); await page.getByRole('button', { name, exact: true }).click();
    expect((await event).suggestedFilename()).toMatch(/\.(pdf|snote)$/);
  }
  await page.screenshot({ path: 'artifacts/https-editor.png', fullPage: true });
  expect(failures).toEqual([]); expect(external).toEqual([]); expect(writes).toEqual([]);
});
