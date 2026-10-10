import { expect, test } from '@playwright/test';

test('INK-05 tool changes, cancel, lost capture and second touch discard drafts and allow the next input', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'ノートを作る', exact: true }).click();
  const canvas = page.locator('#ink');
  const send = async (type: string, id = 1, kind = 'pen', x = 100) => canvas.evaluate((el, p) => {
    const r = el.getBoundingClientRect();
    el.dispatchEvent(new PointerEvent(p.type, { bubbles: true, pointerId: p.id, pointerType: p.kind,
      button: 0, buttons: p.type === 'pointerup' ? 0 : 1, pressure: .8, clientX: r.left + p.x, clientY: r.top + 100 }));
  }, { type, id, kind, x });
  const stored = () => page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open('my-note-app'); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
    });
    try {
      return await new Promise<unknown[]>((resolve, reject) => {
        const r = db.transaction('pages').objectStore('pages').getAll(); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
      });
    } finally { db.close(); }
  });
  for (const [index, end] of ['pointercancel', 'lostpointercapture', 'tool', 'second-touch'].entries()) {
    const before = await stored(), kind = end === 'second-touch' ? 'touch' : 'pen';
    if (kind === 'touch') await page.getByRole('button', { name: '指書き OFF', exact: true }).click();
    await send('pointerdown', 1, kind); await send('pointermove', 1, kind, 140);
    if (end === 'tool') {
      // Programmatic activation avoids blur cancelling the draft before the tool handler is tested.
      await page.getByRole('button', { name: '直線', exact: true }).evaluate(el => (el as HTMLButtonElement).click());
    } else if (end === 'second-touch') {
      await send('pointerdown', 2, 'touch', 200); await send('pointerup', 2, 'touch', 200);
    } else await send(end, 1, kind);
    await send('pointerup', 1, kind, 140);
    await expect(page.getByTestId('element-count')).toHaveText(`${index}要素`);
    expect(await stored(), end).toEqual(before);
    if (kind === 'touch') await page.getByRole('button', { name: '指書き ON', exact: true }).click();
    await page.getByRole('button', { name: 'ペン', exact: true }).click();
    await send('pointerdown', 3, 'pen', 250 + index * 20); await send('pointerup', 3, 'pen', 250 + index * 20);
    await expect(page.getByTestId('stroke-count')).toHaveText(`${index + 1}筆`);
    await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  }
  const expected = await stored(); await page.reload();
  await expect(page.getByTestId('stroke-count')).toHaveText('4筆'); expect(await stored()).toEqual(expected);
});
