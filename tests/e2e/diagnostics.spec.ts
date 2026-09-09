import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
test('PERF diagnostic report records real operations without notebook content', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '動作の計測', exact: true }).click();
  await page.getByRole('button', { name: '計測を開始', exact: true }).click();
  await page.getByRole('button', { name: '閉じる', exact: true }).click();
  await page.getByRole('button', { name: 'ノートを作る', exact: true }).click();
  await page.getByLabel('ノート名', { exact: true }).fill('private-test-content');
  await page.getByLabel('ノート名', { exact: true }).press('Tab');
  const canvas = page.locator('#ink'); const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + 30, box.y + 30); await page.mouse.down();
  await page.mouse.move(box.x + 100, box.y + 90, { steps: 10 }); await page.mouse.up();
  await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  await page.getByRole('button', { name: '動作の計測', exact: true }).click();
  await page.getByRole('button', { name: '計測を停止', exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: '計測結果を書き出す', exact: true }).click();
  const raw = await readFile((await (await download).path())!, 'utf8');
  expect(raw).not.toContain('private-test-content');
  const report = JSON.parse(raw);
  for (const metric of ['input-handler', 'note-open', 'save-start', 'save-commit']) {
    expect(report.measurements[metric].totalCount).toBeGreaterThan(0);
    expect(report.measurements[metric].totalFailures).toBe(0);
    expect(report.measurements[metric].p95Ms).toBeGreaterThanOrEqual(0);
  }
  expect(report.environment.userAgent).toContain('Mozilla');
  expect(report.version).toBeTruthy();
});
