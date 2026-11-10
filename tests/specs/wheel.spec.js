// The mouse wheel scrolls the canvas; Ctrl + wheel zooms.
const { test, expect } = require('@playwright/test');
const { openApp } = require('./helpers');

async function wheel(page, dy, mods = [], dx = 0) {
  const r = await page.locator('#stage').boundingBox();
  await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
  for (const m of mods) await page.keyboard.down(m);
  await page.mouse.wheel(dx, dy);
  for (const m of mods) await page.keyboard.up(m);
  await page.waitForTimeout(50);
}
const state = page => page.evaluate(() => ({ zoom, viewX, viewY, top: stage.scrollTop, left: stage.scrollLeft }));

test('infinite canvas: wheel pans, Shift + wheel pans sideways, zoom stays', async ({ page }) => {
  await openApp(page, 'infinite');
  const a = await state(page);
  await wheel(page, 100);
  const b = await state(page);
  expect(b.zoom).toBe(1);
  expect(b.viewY).toBeCloseTo(a.viewY + 100);
  expect(b.viewX).toBeCloseTo(a.viewX);
  await wheel(page, 100, ['Shift']);
  const c = await state(page);
  expect(c.zoom).toBe(1);
  expect(c.viewX).toBeGreaterThan(b.viewX);
});

test('infinite canvas: Ctrl + wheel zooms', async ({ page }) => {
  await openApp(page, 'infinite');
  // a wheel notch is one 10% step
  await wheel(page, -100, ['Control']);
  expect((await state(page)).zoom).toBeCloseTo(1.1);
  await wheel(page, 100, ['Control']);
  await wheel(page, 100, ['Control']);
  expect((await state(page)).zoom).toBeCloseTo(0.9);
});

test('regular canvas: wheel scrolls the stage, Ctrl + wheel zooms', async ({ page }) => {
  await openApp(page, 'blank');
  await page.evaluate(() => setZoom(4));   // larger than the window, so it can scroll
  const a = await state(page);
  await wheel(page, 200);
  const b = await state(page);
  expect(b.zoom).toBe(4);
  expect(b.top).toBeGreaterThan(a.top);
  await wheel(page, 300, ['Control']);
  expect((await state(page)).zoom).toBeLessThan(4);
});
