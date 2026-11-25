// Grouping and the right-click menu.
const { test, expect } = require('@playwright/test');
const { openApp, screen, click, drag, addObjects, state, noErrors } = require('./helpers');

const RECTS = [
  ['rect', { x: 0, y: 0, w: 100, h: 80, fillOn: true }],
  ['rect', { x: 200, y: 0, w: 100, h: 80, fillOn: true }],
  ['rect', { x: 0, y: 200, w: 100, h: 80, fillOn: true }],
];
async function rightClick(page, x, y) {
  const p = await screen(page, x, y);
  await page.mouse.click(p.x, p.y, { button: 'right' });
}
const menuLabels = page => page.$$eval('#ctx:not([hidden]) button .l', bs => bs.map(b => b.textContent));
const menuItem = (page, label) => page.locator('#ctx button', { has: page.locator('.l', { hasText: new RegExp('^' + label + '$') }) });

test.beforeEach(async ({ page }) => { await openApp(page); await addObjects(page, RECTS); });

test('group from the panel; a click then selects the whole group, and it moves together', async ({ page }) => {
  await click(page, 50, 40);
  await click(page, 250, 40, ['Shift']);
  await page.click('#props button:text-is("Group")');
  let s = await state(page);
  expect(s.last).toBe('Group 2 objects');
  expect(s.objects[0].group).toBeTruthy();
  expect(s.objects[0].group).toBe(s.objects[1].group);
  expect(s.title).toContain('Group');

  await click(page, 50, 230);   // the ungrouped one
  await click(page, 250, 40);
  expect((await state(page)).sel).toHaveLength(2);
  await drag(page, [250, 40], [260, 50], ['Alt']);
  s = await state(page);
  expect(s.objects.map(o => [o.x, o.y])).toEqual([[10, 10], [210, 10], [0, 200]]);

  await page.click('#props button:text-is("Ungroup")');
  s = await state(page);
  expect(s.objects.some(o => o.group)).toBe(false);
  await click(page, 250, 40);
  expect((await state(page)).sel).toHaveLength(1);
  noErrors(page);
});

test('⌘G / ⇧⌘G group and ungroup; Shift-click toggles a whole group', async ({ page }) => {
  await click(page, 50, 40);
  await click(page, 250, 40, ['Shift']);
  await page.keyboard.press('ControlOrMeta+g');
  expect((await state(page)).last).toBe('Group 2 objects');
  await click(page, 50, 230);
  await click(page, 50, 40, ['Shift']);
  expect((await state(page)).sel).toHaveLength(3);
  await click(page, 250, 40, ['Shift']);
  expect((await state(page)).sel).toHaveLength(1);
  await click(page, 50, 40);
  await page.keyboard.press('ControlOrMeta+Shift+g');
  expect((await state(page)).objects.some(o => o.group)).toBe(false);
});

test('duplicating a group makes a new group; deleting down to one member drops the group', async ({ page }) => {
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('ControlOrMeta+g');
  await page.keyboard.press('ControlOrMeta+d');
  let s = await state(page);
  expect(s.objects).toHaveLength(6);
  expect(new Set(s.objects.map(o => o.group)).size).toBe(2);
  expect(s.sel).toHaveLength(3);
  await page.keyboard.press('ControlOrMeta+z');
  await page.keyboard.press('ControlOrMeta+z');   // back to ungrouped
  await page.keyboard.press('ControlOrMeta+a');
  await page.evaluate(() => { setSel([1, 2]); groupSel(); setSel(2); del(); });
  s = await state(page);
  expect(s.objects.some(o => o.group)).toBe(false);
});

test('right-clicking an object selects it and shows its actions', async ({ page }) => {
  await rightClick(page, 50, 40);
  expect((await state(page)).sel).toEqual([1]);
  const labels = await menuLabels(page);
  expect(labels).toEqual(expect.arrayContaining(['Fill', 'Cut', 'Copy', 'Paste', 'Duplicate', 'Bring to front', 'Send to back', 'Delete']));
  expect(labels).not.toContain('Group');
  await menuItem(page, 'Fill').click();
  expect((await state(page)).objects[0].fillOn).toBe(false);
  expect(await page.isHidden('#ctx')).toBe(true);
});

test('right-clicking a multi-selection offers Group, then Ungroup', async ({ page }) => {
  await click(page, 50, 40);
  await click(page, 250, 40, ['Shift']);
  await rightClick(page, 250, 40);
  expect((await state(page)).sel).toHaveLength(2);   // the selection is kept
  await menuItem(page, 'Group').click();
  expect((await state(page)).last).toBe('Group 2 objects');
  await click(page, 50, 230);
  await rightClick(page, 50, 40);   // selects the whole group
  expect((await state(page)).sel).toHaveLength(2);
  const labels = await menuLabels(page);
  expect(labels).toContain('Ungroup');
  expect(labels).not.toContain('Group');
  await menuItem(page, 'Ungroup').click();
  expect((await state(page)).objects.some(o => o.group)).toBe(false);
  noErrors(page);
});

test('the menu closes on Escape and on a click elsewhere, without acting on the canvas', async ({ page }) => {
  await rightClick(page, 50, 40);
  await page.keyboard.press('Escape');
  expect(await page.isHidden('#ctx')).toBe(true);
  await rightClick(page, 50, 40);
  await click(page, -60, -60);   // empty space, left of the menu
  expect(await page.isHidden('#ctx')).toBe(true);
  expect((await state(page)).sel).toEqual([1]);   // that click only closed the menu, it didn't deselect
});

test('type-specific items: arrow reverse, text edit, empty-canvas items', async ({ page }) => {
  await addObjects(page, [['arrow', { x1: 400, y1: 0, x2: 500, y2: 0 }], ['text', { x: 400, y: 200, text: 'Hi' }]]);
  await rightClick(page, 450, 0);
  await menuItem(page, 'Reverse direction').click();
  const a = (await state(page)).objects[3];
  expect([a.x1, a.x2]).toEqual([500, 400]);

  await rightClick(page, 410, 215);
  await menuItem(page, 'Edit text').click();
  expect(await page.evaluate(() => !!editing)).toBe(true);
  await page.keyboard.press('Escape');

  await rightClick(page, 700, 500);
  expect((await state(page)).sel).toEqual([]);
  const labels = await menuLabels(page);
  expect(labels).toEqual(expect.arrayContaining(['Paste', 'Select all', 'Add text here', 'Convert to regular canvas', 'Fit to window']));
  await menuItem(page, 'Select all').click();
  expect((await state(page)).sel).toHaveLength(5);
});

test('copy from the menu, then paste at the right-clicked point', async ({ page }) => {
  await rightClick(page, 50, 40);
  await menuItem(page, 'Copy').click();
  await rightClick(page, 650, 450);
  await menuItem(page, 'Paste').click();
  await expect.poll(async () => (await state(page)).objects.length).toBe(4);
  const o = (await state(page)).objects[3];
  expect([o.x + o.w / 2, o.y + o.h / 2]).toEqual([650, 450]);
  noErrors(page);
});
