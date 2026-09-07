import { expect, test } from '@playwright/test';
test('NOTE-03 図形3種を作成・保存し消しゴムとUndoで復元', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'ノートを作る', exact: true }).click();
  await expect(page.getByRole('button', { name: '直線', exact: true })).toBeVisible();
  const canvas = page.getByLabel('手書きキャンバス', { exact: true });
  for (const [i, name] of ['直線', '長方形', '楕円'].entries()) {
    await page.getByRole('button', { name, exact: true }).click();
    const box = (await canvas.boundingBox())!;
    await page.mouse.move(box.x + 40 + i * 150, box.y + 40); await page.mouse.down();
    await page.mouse.move(box.x + 120 + i * 150, box.y + 120); await page.mouse.up();
  }
  await expect(page.getByTestId('element-count')).toHaveText('3要素');
  await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  await page.reload(); await expect(page.getByTestId('element-count')).toHaveText('3要素');
  await page.getByRole('button', { name: '消しゴム', exact: true }).click();
  const box = (await canvas.boundingBox())!; await page.mouse.click(box.x + 190, box.y + 80);
  await expect(page.getByTestId('element-count')).toHaveText('2要素');
  await page.getByRole('button', { name: '元に戻す', exact: true }).click();
  await expect(page.getByTestId('element-count')).toHaveText('3要素');
});
