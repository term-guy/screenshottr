// Pen and highlighter.
const { test, expect } = require('@playwright/test');
const { openApp, drag, click, state, noErrors } = require('./helpers');

for (const [key, type] of [['d', 'pen'], ['h', 'marker']]) {
  test(`${type}: draws strokes and stays on`, async ({ page }) => {
    await openApp(page);
    await page.keyboard.press(key);
    await drag(page, [10, 10], [200, 120], [], 20);
    await drag(page, [10, 300], [200, 300], [], 10);
    const s = await state(page);
    expect(s.objects.map(o => o.type)).toEqual([type, type]);
    expect(s.objects[0].pts.length).toBeGreaterThan(10);
    expect(s.last).toBe('Add ' + (type === 'pen' ? 'pen' : 'highlight'));
    expect(await page.evaluate(() => tool)).toBe(type);
    noErrors(page);
  });
}

test('strokes can be selected, moved and copied', async ({ page }) => {
  await openApp(page);
  await page.keyboard.press('d');
  await drag(page, [10, 100], [300, 100], [], 10);
  await page.keyboard.press('v');
  await click(page, 150, 100);
  expect((await state(page)).sel).toHaveLength(1);
  await drag(page, [150, 100], [150, 150], ['Alt']);
  const o = (await state(page)).objects[0];
  expect(o.pts[1]).toBeCloseTo(150, 0);
  await page.keyboard.press('ControlOrMeta+d');
  expect((await state(page)).objects).toHaveLength(2);
  noErrors(page);
});

test('the highlighter has a wider weight range in the panel', async ({ page }) => {
  await openApp(page);
  await page.keyboard.press('h');
  expect(await page.locator('#props input[type=range]').first().getAttribute('max')).toBe('80');
});
