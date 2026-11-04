// Pen and highlighter.
const { test, expect } = require('@playwright/test');
const { openApp, screen, drag, click, addObjects, state, noErrors } = require('./helpers');

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

test('nothing is selected (no selection box) while drawing', async ({ page }) => {
  await openApp(page);
  await page.keyboard.press('d');
  const a = await screen(page, 10, 10), b = await screen(page, 200, 100);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y, { steps: 10 });
  expect(await page.evaluate(() => selIds.length)).toBe(0);
  await page.mouse.up();
  expect((await state(page)).sel).toEqual([]);
});

// Colour of the canvas pixel at a world point.
const pixel = (page, x, y) => page.evaluate(([x, y]) => {
  const r = cv.getBoundingClientRect(), s = cv.width / r.width;
  return [...ctx.getImageData(Math.round((x - viewX) * zoom * s), Math.round((y - viewY) * zoom * s), 1, 1).data];
}, [x, y]);

for (const [bg, blend] of [['#ffffff', 'multiply'], ['#000000', 'screen']]) {
  test(`highlighter shows on a ${blend === 'screen' ? 'dark' : 'light'} background`, async ({ page }) => {
    await openApp(page);
    await addObjects(page, [['rect', { x: 0, y: 0, w: 400, h: 200, fillOn: true, fill: bg, width: 0 }]]);
    await page.keyboard.press('h');
    await drag(page, [20, 100], [380, 100], [], 12);
    const o = (await state(page)).objects[1];
    expect(o.blend).toBe(blend);
    await page.waitForTimeout(50);   // next animation frame
    const [r, g, b] = await pixel(page, 200, 100);
    // tinted yellow: red and green clearly above blue, and not the plain background
    expect(r - b).toBeGreaterThan(60);
    expect(g - b).toBeGreaterThan(40);
    noErrors(page);
  });
}

test('the highlighter shows a text cursor, the pen a crosshair', async ({ page }) => {
  await openApp(page);
  const cursorAt = async () => { const p = await screen(page, 50, 50); await page.mouse.move(p.x, p.y); return page.evaluate(() => cv.style.cursor); };
  await page.keyboard.press('h');
  expect(await cursorAt()).toBe('text');
  await drag(page, [20, 50], [200, 50], [], 8);
  expect(await cursorAt()).toBe('text');
  await page.keyboard.press('d');
  expect(await cursorAt()).toBe('crosshair');
});
