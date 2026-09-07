import { expect, test } from '@playwright/test';
test('NOTE-05 蛍光ペンの一筆内の交差は同色、別筆は濃く、再表示で一致', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'ノートを作る', exact: true }).click();
  await expect(page.getByRole('button', { name: '蛍光ペン', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '蛍光ペン', exact: true }).click();
  await page.getByLabel('太さ', { exact: true }).fill('12');
  const canvas = page.getByLabel('手書きキャンバス', { exact: true });
  const draw = async (points: number[][]) => {
    await canvas.evaluate((el, points) => {
      const r = el.getBoundingClientRect();
      for (let i = 0; i < points.length; i++) el.dispatchEvent(new PointerEvent(i === 0 ? 'pointerdown' : i === points.length - 1 ? 'pointerup' : 'pointermove', { pointerId: 90, pointerType: 'pen', clientX: r.left + points[i][0], clientY: r.top + points[i][1], button: 0, pressure: 1, bubbles: true }));
    }, points);
  };
  const rgb = (x: number, y: number) => page.locator('#committed').evaluate((el, p) => [...(el as HTMLCanvasElement).getContext('2d')!.getImageData(p.x, p.y, 1, 1).data].slice(0, 3), { x, y });
  await draw([[50, 50], [150, 150], [50, 150], [150, 50]]);
  const once = await rgb(100, 100);
  expect(await rgb(75, 75)).toEqual(once);
  await draw([[60, 100], [140, 100]]);
  const twice = await rgb(100, 100); expect(twice[0]).toBeLessThan(once[0]);
  await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  await page.reload(); expect(await rgb(100, 100)).toEqual(twice);
});
