// Multiple selection, group moves and actions, and snapping.
const { test, expect } = require('@playwright/test');
const { openApp, screen, click, drag, addObjects, state, noErrors } = require('./helpers');

const RECTS = [
  ['rect', { x: 0, y: 0, w: 100, h: 80, fillOn: true }],
  ['rect', { x: 200, y: 0, w: 100, h: 80, fillOn: true }],
  ['rect', { x: 0, y: 200, w: 100, h: 80, fillOn: true }],
];

test.beforeEach(async ({ page }) => { await openApp(page); await addObjects(page, RECTS); });

test('shift-click adds and removes objects', async ({ page }) => {
  await click(page, 50, 40);
  await click(page, 250, 40, ['Shift']);
  expect((await state(page)).sel).toHaveLength(2);
  expect((await state(page)).title).toContain('2 objects');
  await click(page, 250, 40, ['Shift']);
  expect((await state(page)).sel).toHaveLength(1);
});

test('dragging one selected object moves the whole selection', async ({ page }) => {
  await click(page, 50, 40);
  await click(page, 250, 40, ['Shift']);
  await drag(page, [250, 40], [290, 90], ['Alt']);   // Alt: no snapping, exact offset
  const s = await state(page);
  expect(s.objects.map(o => [o.x, o.y])).toEqual([[40, 50], [240, 50], [0, 200]]);
  expect(s.last).toBe('Move 2 objects');
});

test('a click without dragging on one of several selected selects just it', async ({ page }) => {
  await page.keyboard.press('ControlOrMeta+a');
  expect((await state(page)).sel).toHaveLength(3);
  await click(page, 250, 40);
  expect((await state(page)).sel).toHaveLength(1);
});

test('shift-drag selects everything inside the box', async ({ page }) => {
  await drag(page, [-20, -20], [320, 100], ['Shift']);
  expect((await state(page)).sel).toHaveLength(2);
});

test('nudge, duplicate, delete and undo act on the selection', async ({ page }) => {
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('ArrowRight');
  expect((await state(page)).objects.map(o => o.x)).toEqual([1, 201, 1]);
  await page.keyboard.press('ControlOrMeta+d');
  expect((await state(page)).objects).toHaveLength(6);
  await page.keyboard.press('Backspace');
  expect((await state(page)).last).toBe('Delete 3 objects');
  await page.keyboard.press('ControlOrMeta+z');
  expect((await state(page)).objects).toHaveLength(6);
  noErrors(page);
});

test('moving snaps edges and centres to other objects, with guides', async ({ page }) => {
  await click(page, 50, 230);
  // drag the third rect so its left edge lands 4px from the second rect's left edge (x = 200)
  const a = await screen(page, 50, 230), b = await screen(page, 254, 230);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y, { steps: 6 });
  const guides = await page.evaluate(() => drag && drag.guides);
  await page.mouse.up();
  expect((await state(page)).objects[2].x).toBe(200);
  expect(guides).toContainEqual({ x: 200 });
});

test('Alt turns snapping off', async ({ page }) => {
  await click(page, 50, 230);
  await drag(page, [50, 230], [254, 230], ['Alt']);
  expect((await state(page)).objects[2].x).toBe(204);
});
