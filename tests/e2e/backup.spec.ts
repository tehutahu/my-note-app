import { expect, test } from '@playwright/test';
test('XFER-01/02 全体バックアップを2回コピー取り込みして既存ノートを保持', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'ノートを作る', exact: true }).click();
  await page.getByRole('button', { name: 'ノート一覧', exact: true }).click();
  const button = page.getByRole('button', { name: '全体バックアップを書き出す', exact: true });
  await expect(button).toBeVisible();
  const event = page.waitForEvent('download'); await button.click(); const download = await event;
  await download.saveAs('/workspace/artifacts/test-backup.snote');
  for (let i = 0; i < 2; i++) {
    await page.getByLabel('バックアップを読み込む', { exact: true }).setInputFiles('/workspace/artifacts/test-backup.snote');
    await expect(page.getByRole('button', { name: 'はじめてのノート', exact: true })).toHaveCount(i + 2);
  }
  await page.reload(); await expect(page.getByRole('button', { name: 'はじめてのノート', exact: true })).toHaveCount(3);
});
test('XFER-03 不正なバックアップの理由を表示し既存データを変えない', async ({ page }) => {
  await page.goto('/');
  const input = page.getByLabel('バックアップを読み込む', { exact: true });
  await expect(input).toBeVisible();
  await input.setInputFiles({ name: 'bad.snote', mimeType: 'application/json', buffer: Buffer.from('{broken') });
  await expect(page.getByRole('alert')).toContainText('JSON');
  await expect(page.getByRole('button', { name: 'ノートを作る', exact: true })).toBeEnabled();
});
