import { expect, test } from '@playwright/test';
test('NOTE-01 ページ追加・移動・削除とUndo、保存後の順序を保持', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'ノートを作る', exact: true }).click();
  await expect(page.getByRole('button', { name: 'ページを追加', exact: true })).toBeVisible();
  const canvas = page.getByLabel('手書きキャンバス', { exact: true });
  let box = (await canvas.boundingBox())!;
  await page.mouse.click(box.x + 100, box.y + 100);
  await page.getByRole('button', { name: 'ページを追加', exact: true }).click();
  await expect(page.getByTestId('stroke-count')).toHaveText('0筆');
  box = (await canvas.boundingBox())!;
  await page.mouse.click(box.x + 100, box.y + 100); await page.mouse.click(box.x + 130, box.y + 100);
  await page.getByRole('button', { name: 'ページを前へ', exact: true }).click();
  await expect(page.getByLabel('ページ選択', { exact: true })).toHaveValue('0');
  await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  await page.reload(); await expect(page.getByTestId('stroke-count')).toHaveText('2筆');
  await page.getByLabel('ページ選択', { exact: true }).selectOption('1');
  await expect(page.getByTestId('stroke-count')).toHaveText('1筆');
  await page.getByRole('button', { name: 'ページを削除', exact: true }).click();
  await expect(page.getByRole('button', { name: 'ページを削除', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: '元に戻す', exact: true }).click();
  await expect(page.getByLabel('ページ選択', { exact: true }).locator('option')).toHaveCount(2);
});

test('NOTE-01 20ページの順序と名前が再読み込みで一致する', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'ノートを作る', exact: true }).click();
  await page.getByLabel('ノート名', { exact: true }).fill('二十ページのノート');
  await page.getByLabel('ノート名', { exact: true }).press('Tab');
  for (let i = 1; i < 20; i++) await page.getByRole('button', { name: 'ページを追加', exact: true }).click();
  await page.getByRole('button', { name: 'ページを前へ', exact: true }).click();
  await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  const read = () => page.evaluate(async () => {
    const opened = indexedDB.open('my-note-app');
    const db = await new Promise<IDBDatabase>(resolve => { opened.onsuccess = () => resolve(opened.result); });
    const operation = db.transaction('notebooks').objectStore('notebooks').getAll();
    return new Promise<{ title: string; pageIds: string[] }>(resolve => { operation.onsuccess = () => { db.close(); resolve({ title: operation.result[0].title, pageIds: operation.result[0].pageIds }); }; });
  });
  const expected = await read(); expect(expected.pageIds).toHaveLength(20);
  await page.reload();
  await expect(page.getByLabel('ノート名', { exact: true })).toHaveValue('二十ページのノート');
  await expect(page.getByLabel('ページ選択', { exact: true }).locator('option')).toHaveCount(20);
  expect(await read()).toEqual(expected);
});
