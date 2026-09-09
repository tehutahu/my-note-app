import { test, expect } from '@playwright/test';

test('pen barrel switch toggles once per press without hover ink; mouse secondary is ignored', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'ノートを作る', exact: true }).click();
  const canvas = page.locator('#ink');
  const send = async (type: string, buttons: number, button = -1, pointerType = 'pen') => {
    await canvas.dispatchEvent(type, { pointerId: 71, pointerType, buttons, button, clientX: 100, clientY: 400, pressure: 0 });
  };
  await send('pointerdown', 2, 2);
  await expect(page.locator('[data-tool=eraser]')).toHaveAttribute('aria-pressed', 'true');
  await send('pointermove', 2);
  await send('pointermove', 2);
  await send('pointerup', 0, 2);
  await expect(page.locator('[data-tool=eraser]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('stroke-count')).toHaveText('0筆');
  await send('pointerdown', 2, 2);
  await send('pointerup', 0, 2);
  await expect(page.locator('[data-tool=pen]')).toHaveAttribute('aria-pressed', 'true');
  await send('pointerdown', 2, 2, 'mouse');
  await send('pointerup', 0, 2, 'mouse');
  await expect(page.locator('[data-tool=pen]')).toHaveAttribute('aria-pressed', 'true');
  // A chorded side-button press arrives as pointermove while the tip is down.
  await send('pointerdown', 1, 0);
  await send('pointermove', 3, 2);
  await send('pointermove', 1, 2);
  await send('pointerup', 0, 0);
  await expect(page.locator('[data-tool=eraser]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('stroke-count')).toHaveText('0筆');
  await send('pointermove', 2, 2);
  await send('pointercancel', 0);
  await send('pointerdown', 2, 2);
  await send('pointerup', 0, 2);
  await expect(page.locator('[data-tool=eraser]')).toHaveAttribute('aria-pressed', 'true');
});

test('switch-selected eraser removes a stroke, undo restores it, and next press writes again', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'ノートを作る', exact: true }).click();
  const canvas = page.locator('#ink');
  const send = async (type: string, buttons: number, button: number) => {
    await canvas.evaluate((el, p) => {
      const rect = el.getBoundingClientRect();
      el.dispatchEvent(new PointerEvent(p.type, { bubbles: true, pointerType: 'pen', pointerId: 9,
        clientX: rect.left + 80, clientY: rect.top + 80, buttons: p.buttons, button: p.button, pressure: p.buttons === 1 ? .8 : 0 }));
    }, { type, buttons, button });
  };
  const dot = async () => { await send('pointerdown', 1, 0); await send('pointerup', 0, 0); };
  const toggle = async () => { await send('pointerdown', 2, 2); await send('pointerup', 0, 2); };
  await dot();
  await expect(page.getByTestId('stroke-count')).toHaveText('1筆');
  await toggle();
  await expect(page.getByTestId('stroke-count')).toHaveText('1筆');
  await dot();
  await expect(page.getByTestId('stroke-count')).toHaveText('0筆');
  await page.getByRole('button', { name: '元に戻す', exact: true }).click();
  await expect(page.getByTestId('stroke-count')).toHaveText('1筆');
  await toggle(); await dot();
  await expect(page.getByTestId('stroke-count')).toHaveText('2筆');
  await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  await page.reload();
  await expect(page.getByTestId('stroke-count')).toHaveText('2筆');
});
