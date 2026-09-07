import { expect, test } from '@playwright/test';
test('DATA-03 2タブの競合を明示し編集を止め、未保存の変更を独立コピーへ救出する', async ({ page, context }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'ノートを作る', exact: true }).click();
  await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  const other = await context.newPage(); await other.goto(page.url()); await expect(other.getByTestId('save-status')).toHaveText('保存済み');
  for (const tab of [page, other]) {
    const box = (await tab.getByLabel('手書きキャンバス').boundingBox())!;
    await tab.mouse.click(box.x + (tab === page ? 80 : 150), box.y + 100);
    if (tab === page) await expect(tab.getByTestId('save-status')).toHaveText('保存済み');
  }
  await expect(other.getByRole('alert')).toContainText('競合');
  await expect(other.getByRole('button', { name: 'ペン', exact: true })).toBeDisabled();
  const stoppedBox = (await other.getByLabel('手書きキャンバス').boundingBox())!;
  await other.mouse.click(stoppedBox.x + 200, stoppedBox.y + 100); await expect(other.getByTestId('stroke-count')).toHaveText('1筆');
  const download = other.waitForEvent('download'); await other.getByRole('button', { name: 'このノートを書き出す', exact: true }).click(); expect((await download).suggestedFilename()).toBe('note.snote');
  await other.getByRole('button', { name: '変更をコピーとして保存', exact: true }).click();
  await expect(other.getByTestId('save-status')).toHaveText('保存済み'); await expect(other.getByTestId('stroke-count')).toHaveText('1筆');
  expect(other.url()).not.toBe(page.url());
  const positions = async (tab: typeof page) => tab.evaluate(async () => {
    const request = indexedDB.open('my-note-app');
    const db = await new Promise<IDBDatabase>(resolve => { request.onsuccess = () => resolve(request.result); });
    const result = db.transaction('pages').objectStore('pages').getAll();
    return new Promise<number[]>(resolve => { result.onsuccess = () => { db.close(); resolve(result.result.map(p => p.elements[0].points[0].x).sort((a,b) => a-b)); }; });
  });
  expect(await positions(other)).toEqual([80,150]);
  await page.reload(); await expect(page.getByTestId('stroke-count')).toHaveText('1筆');
});
