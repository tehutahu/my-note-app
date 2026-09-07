import { expect, test } from '@playwright/test';
test('INK-01/04 マウスで書く・一筆消す・元に戻す・やり直す', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'ノートを作る', exact: true }).click();
  const canvas = page.getByLabel('手書きキャンバス', { exact: true });
  await expect(canvas).toBeVisible();
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + 80, box.y + 80);
  await page.mouse.down(); await page.mouse.move(box.x + 160, box.y + 100, { steps: 8 }); await page.mouse.up();
  await expect(page.getByTestId('stroke-count')).toHaveText('1筆');
  await page.getByRole('button', { name: '消しゴム', exact: true }).click();
  await page.mouse.click(box.x + 120, box.y + 90);
  await expect(page.getByTestId('stroke-count')).toHaveText('0筆');
  await page.getByRole('button', { name: '元に戻す', exact: true }).click();
  await expect(page.getByTestId('stroke-count')).toHaveText('1筆');
  await page.getByRole('button', { name: 'やり直す', exact: true }).click();
  await expect(page.getByTestId('stroke-count')).toHaveText('0筆');
  await page.screenshot({ path: 'artifacts/pen-desktop.png', fullPage: true });
});

test('INK-02 指の移動・ピンチと指書き切替、ペン中のタッチ抑制', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'ノートを作る', exact: true }).click();
  const canvas = page.getByLabel('手書きキャンバス', { exact: true });
  await expect(page.getByRole('button', { name: '指書き OFF', exact: true })).toBeVisible();
  const pointer = async (type: string, id: number, x: number, kind = 'touch') => {
    await canvas.evaluate((el, p) => {
      const rect = el.getBoundingClientRect();
      el.dispatchEvent(new PointerEvent(p.type, { pointerId: p.id, pointerType: p.kind, clientX: rect.left + p.x, clientY: rect.top + 80, button: 0, buttons: 1, pressure: .8, bubbles: true }));
    }, { type, id, x, kind });
  };
  await pointer('pointerdown', 10, 50); await pointer('pointermove', 10, 100); await pointer('pointerup', 10, 100);
  await expect(page.getByTestId('stroke-count')).toHaveText('0筆');
  await expect(canvas).toHaveAttribute('data-pan-x', '50');
  await pointer('pointerdown', 11, 50); await pointer('pointerdown', 12, 150); await pointer('pointermove', 12, 250);
  await expect(page.getByTestId('zoom')).toHaveText('200%');
  await pointer('pointerup', 12, 250); await pointer('pointerup', 11, 50);
  await page.getByRole('button', { name: '指書き OFF', exact: true }).click();
  await pointer('pointerdown', 20, 70); await pointer('pointerup', 20, 70);
  await expect(page.getByTestId('stroke-count')).toHaveText('1筆');
  await pointer('pointerdown', 21, 50); await pointer('pointerdown', 22, 150); await pointer('pointerup', 22, 150); await pointer('pointerup', 21, 50);
  await expect(page.getByTestId('stroke-count')).toHaveText('1筆');
  const pan = await canvas.getAttribute('data-pan-x');
  await pointer('pointerdown', 30, 80, 'pen'); await pointer('pointerdown', 31, 50); await pointer('pointermove', 31, 100); await pointer('pointerup', 31, 100); await pointer('pointerup', 30, 80, 'pen');
  await expect(canvas).toHaveAttribute('data-pan-x', pan!);
  await expect(page.getByTestId('stroke-count')).toHaveText('2筆');
});

test('INK-05 キャンセル・capture消失・ツール変更で途中の線を破棄', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'ノートを作る', exact: true }).click();
  const canvas = page.getByLabel('手書きキャンバス', { exact: true });
  for (const end of ['pointercancel', 'lostpointercapture']) {
    await canvas.evaluate((el, end) => {
      const rect = el.getBoundingClientRect();
      for (const type of ['pointerdown', 'pointermove', end]) el.dispatchEvent(new PointerEvent(type, { pointerId: 40, pointerType: 'pen', clientX: rect.left + 90, clientY: rect.top + 90, button: 0, pressure: .8, bubbles: true }));
    }, end);
    await expect(page.getByTestId('stroke-count')).toHaveText('0筆');
  }
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + 100, box.y + 100); await page.mouse.down(); await page.mouse.up();
  await expect(page.getByTestId('stroke-count')).toHaveText('1筆');
});

test('INK-01 pointerupの位置まで線が届き、末尾の筆圧0で細くならない', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'ノートを作る', exact: true }).click();
  const canvas = page.getByLabel('手書きキャンバス', { exact: true });
  await canvas.evaluate(el => {
    const rect = el.getBoundingClientRect();
    for (const [type, x, pressure] of [['pointerdown', 80, .8], ['pointerup', 160, 0]] as const) {
      el.dispatchEvent(new PointerEvent(type, { pointerId: 40, pointerType: 'pen', clientX: rect.left + x, clientY: rect.top + 80, button: 0, pressure, bubbles: true }));
    }
  });
  const rgb = await page.locator('#committed').evaluate(el => [...(el as HTMLCanvasElement).getContext('2d')!.getImageData(140, 80, 1, 1).data]);
  expect(rgb.slice(0, 3)).toEqual([36, 79, 70]);
});

test('INK-05 ピンチ中のcapture消失で全接点を解除する', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'ノートを作る', exact: true }).click();
  const canvas = page.getByLabel('手書きキャンバス', { exact: true });
  await canvas.evaluate(el => {
    const rect = el.getBoundingClientRect();
    for (const [type, id, x] of [['pointerdown', 10, 50], ['pointerdown', 11, 150], ['lostpointercapture', 10, 50], ['pointermove', 11, 250]] as const) {
      el.dispatchEvent(new PointerEvent(type, { pointerId: id, pointerType: 'touch', clientX: rect.left + x, clientY: rect.top + 80, button: 0, bubbles: true }));
    }
  });
  await expect(page.getByTestId('zoom')).toHaveText('100%');
});
