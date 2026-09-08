import { expect, test, type Page } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';

async function layout(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  const controls = page.locator('button:visible, input:visible, select:visible');
  const boxes = await controls.evaluateAll(nodes => nodes.map(el => ({ html: el.outerHTML, x: el.getBoundingClientRect().x, width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height })));
  expect(boxes.length).toBeGreaterThan(0);
  for (const box of boxes) {
    expect(box.width, box.html).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x).toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width).toBeLessThanOrEqual((page.viewportSize()!.width) + 1);
  }
}
for (const [width, height] of [[320, 740], [412, 915], [800, 1280], [1280, 800]]) {
  test(`UI-01/03 ${width}×${height} long titles and controls stay within the viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height }); await page.goto('/');
    await expect(page.getByTestId('offline-status')).toHaveText('オフライン準備完了');
    await layout(page);
    await page.getByRole('button', { name: 'ノートを作る', exact: true }).click();
    await page.getByLabel('ノート名', { exact: true }).fill('長い日本語の会議記録'.repeat(10));
    await page.getByLabel('ノート名', { exact: true }).press('Tab');
    await expect(page.getByTestId('save-status')).toHaveText('保存済み');
    await layout(page);
    await page.getByRole('button', { name: 'ノート一覧', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'ノート一覧', exact: true })).toBeVisible();
    await layout(page);
  });
}

test('PDF-01 width fit uses the current PDF page dimensions', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 1280 });
  const pdf = await PDFDocument.create(); pdf.addPage([1200, 400]); pdf.addPage([900, 500]);
  await page.goto('/');
  await page.getByLabel('PDFを取り込む', { exact: true }).setInputFiles({ name: 'wide.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await pdf.save()) });
  await expect(page.getByTestId('pdf-status')).toHaveText('PDF表示済み');
  const stageWidth = await page.locator('.paper-space').evaluate(el => el.clientWidth);
  await expect(page.getByTestId('zoom')).toHaveText(`${Math.round(stageWidth / 1200 * 100)}%`);
  await page.getByLabel('ページ選択', { exact: true }).selectOption('1');
  await page.getByRole('button', { name: '用紙を合わせる', exact: true }).click();
  await expect(page.getByTestId('zoom')).toHaveText(`${Math.round(stageWidth / 900 * 100)}%`);
});

test('UI-02 keyboard controls have names, focus indicators and modal focus restoration', async ({ page }) => {
  const named = async () => {
    for (const control of await page.locator('button:visible, input:visible, select:visible').all()) await expect(control).toHaveAccessibleName(/\S/);
  };
  await page.goto('/'); await named();
  const create = page.getByRole('button', { name: 'ノートを作る', exact: true });
  await expect(create).toBeEnabled(); await create.focus(); await page.keyboard.press('Enter');
  const pen = page.getByRole('button', { name: '蛍光ペン', exact: true });
  await expect(pen).toBeEnabled(); await pen.focus(); await page.keyboard.press('Enter');
  await expect(pen).toHaveAttribute('aria-pressed', 'true');
  expect(await pen.evaluate(el => getComputedStyle(el).outlineStyle)).not.toBe('none');
  await named();
  const back = page.getByRole('button', { name: 'ノート一覧', exact: true });
  await expect(back).toBeEnabled(); await back.focus(); await page.keyboard.press('Enter');
  const trash = page.getByRole('button', { name: 'ノートをゴミ箱へ', exact: true });
  await expect(trash).toBeEnabled(); await trash.focus(); await page.keyboard.press('Enter');
  const open = page.getByRole('button', { name: 'ゴミ箱を開く', exact: true });
  await expect(open).toBeEnabled(); await open.focus(); await page.keyboard.press('Enter');
  const remove = page.getByRole('button', { name: '完全削除: はじめてのノート', exact: true });
  await expect(remove).toBeEnabled(); await remove.focus(); await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('button', { name: 'キャンセル', exact: true })).toBeFocused();
  await named();
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press(i < 3 ? 'Tab' : 'Shift+Tab');
    expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0); await expect(remove).toBeFocused();
});
