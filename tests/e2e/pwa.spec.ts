import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
test('PWA-01 オフライン再起動後にPDFへ筆記・保存・二形式を書き出せる', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByTestId('offline-status')).toHaveText('オフライン準備完了', { timeout: 20000 });
  const pdf = await PDFDocument.create(); pdf.addPage().drawText('Offline sample');
  await page.getByLabel('PDFを取り込む', { exact: true }).setInputFiles({ name: 'offline.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await pdf.save()) });
  await expect(page.getByTestId('pdf-status')).toHaveText('PDF表示済み');
  await context.setOffline(true); await page.reload();
  await expect(page.getByTestId('pdf-status')).toHaveText('PDF表示済み');
  const canvas = page.getByLabel('手書きキャンバス');
  await canvas.dispatchEvent('pointerdown', { pointerId: 1, pointerType: 'pen', clientX: 100, clientY: 650, pressure: .8, buttons: 1 });
  await canvas.dispatchEvent('pointerup', { pointerId: 1, pointerType: 'pen', clientX: 140, clientY: 670, pressure: 0 });
  await expect(page.getByTestId('stroke-count')).toHaveText('1筆');
  await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  for (const name of ['PDFを書き出す', 'このノートを書き出す']) {
    const event = page.waitForEvent('download'); await page.getByRole('button', { name, exact: true }).click(); expect((await event).suggestedFilename()).toMatch(/\.(pdf|snote)$/);
  }
  await page.reload(); await expect(page.getByTestId('stroke-count')).toHaveText('1筆');
});
test('PWA-02 インストール用manifestとローカルアイコンを提供する', async ({ page, request }) => {
  await page.goto('/');
  const link = page.locator('link[rel=manifest]'); await expect(link).toHaveCount(1);
  const response = await request.get(await link.getAttribute('href') as string);
  const manifest = await response.json(); expect(manifest.display).toBe('standalone'); expect(manifest.name).toBe('てのひらノート');
  for (const icon of manifest.icons) expect((await request.get(icon.src)).ok()).toBeTruthy();
});
