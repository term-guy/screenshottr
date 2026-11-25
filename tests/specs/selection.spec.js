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

test('a dragged image lands on whole pixels, even when the zoom makes the pointer move by fractions', async ({ page }) => {
  await openApp(page);
  await page.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 40; c.height = 30;
    c.getContext('2d').fillRect(0, 0, 40, 30);
    await addImageObject(await toBlob(c), 'test image', { x: 70, y: 65 });
    setZoom(1.37); viewX = -100; viewY = -100; render();
  });
  await drag(page, [60, 60], [73.3, 81.7]);
  const o = (await state(page)).objects.find(x => x.type === 'image');
  expect(o.x).not.toBe(50);
  expect(Number.isInteger(o.x) && Number.isInteger(o.y)).toBe(true);
  noErrors(page);
});

// Crop: a 200x100 image at (0, 300), a rect whose left edge is at x = 150 and bottom at y = 380.
async function cropSetup(page) {
  await page.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 200; c.height = 100;
    c.getContext('2d').fillRect(0, 0, 200, 100);
    await addImageObject(await toBlob(c), 'test image', { x: 0, y: 300 });
    const o = objects.find(x => x.type === 'image');
    o.x = 0; o.y = 300;
    newObj('rect', { x: 150, y: 420, w: 40, h: -40 });
    startCrop(o); render();
  });
}
const img = async page => (await state(page)).objects.find(x => x.type === 'image');

test('a crop edge snaps to other objects, with a guide', async ({ page }) => {
  await cropSetup(page);
  const a = await screen(page, 200, 350), b = await screen(page, 154, 350);   // east handle to 4px past x = 150
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y, { steps: 6 });
  const guides = await page.evaluate(() => drag && drag.guides);
  await page.mouse.up();
  const o = await img(page);
  expect(o.x + o.w).toBe(150);
  expect(o.crop).toMatchObject({ x: 0, w: 150 });
  expect(guides).toContainEqual({ x: 150 });
  noErrors(page);
});

test('a corner crop handle snaps both ways, and Alt turns it off', async ({ page }) => {
  await cropSetup(page);
  await drag(page, [200, 400], [153, 383]);   // south-east corner near (150, 380)
  let o = await img(page);
  expect([o.x + o.w, o.y + o.h]).toEqual([150, 380]);
  await page.evaluate(() => { const o = objects.find(x => x.type === 'image'); endCrop(false); startCrop(o); render(); });
  await drag(page, [200, 400], [153, 383], ['Alt']);
  o = await img(page);
  expect([o.x + o.w, o.y + o.h]).toEqual([153, 383]);
});

test('sliding the crop snaps its edges', async ({ page }) => {
  await cropSetup(page);
  await drag(page, [200, 400], [100, 400], ['Alt']);   // crop to 100 wide: x 0..100
  await drag(page, [50, 350], [97, 350]);   // slide right; right edge 147 snaps to 150
  const o = await img(page);
  expect(o.x).toBe(50);
  expect(o.crop).toMatchObject({ x: 50, w: 100 });
  noErrors(page);
});

test('resizing snaps the dragged edge to other objects, with a guide; Alt turns it off', async ({ page }) => {
  await click(page, 50, 230);   // third rect: x 0..100, y 200..280
  const a = await screen(page, 100, 240), b = await screen(page, 204, 240);   // east handle to 4px past x = 200
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y, { steps: 6 });
  const guides = await page.evaluate(() => drag && drag.guides);
  await page.mouse.up();
  expect((await state(page)).objects[2]).toMatchObject({ x: 0, w: 200 });
  expect(guides).toContainEqual({ x: 200 });
  await drag(page, [200, 240], [304, 240], ['Alt']);
  expect((await state(page)).objects[2].w).toBe(304);
  noErrors(page);
});

test('a line end snaps to other objects', async ({ page }) => {
  await addObjects(page, [['line', { x1: 150, y1: 150, x2: 250, y2: 160 }]]);
  await click(page, 200, 155);
  await drag(page, [250, 160], [297, 163]);   // x snaps to the second rect's right edge (300); no line near y = 163
  const l = (await state(page)).objects.find(o => o.type === 'line');
  expect([l.x2, l.y2]).toEqual([300, 163]);
  noErrors(page);
});

test.describe('box select tool', () => {
  test('a drag anywhere selects what is inside, then goes back to Select', async ({ page }) => {
    await page.keyboard.press('m');
    expect(await page.evaluate(() => tool)).toBe('box');
    await drag(page, [-20, -20], [320, 100]);   // starts on empty space (which pans with Select)
    let s = await state(page);
    expect(s.sel).toEqual([1, 2]);
    expect(await page.evaluate(() => tool)).toBe('select');

    await page.click('.tool[data-tool="box"]');
    await drag(page, [210, 40], [-20, 300]);   // starting on an object still draws a box; replaces the selection
    s = await state(page);
    expect(s.sel).toEqual([3]);
    expect(s.objects.map(o => [o.x, o.y])).toEqual([[0, 0], [200, 0], [0, 200]]);   // nothing moved
    noErrors(page);
  });

  test('Shift adds; a click picks one object; a click on empty space clears', async ({ page }) => {
    await click(page, 250, 40);
    await page.keyboard.press('m');
    await drag(page, [-20, 180], [120, 300], ['Shift']);
    expect((await state(page)).sel).toEqual([2, 3]);
    await page.keyboard.press('m');
    await click(page, 50, 40);
    expect((await state(page)).sel).toEqual([1]);
    await page.keyboard.press('m');
    await click(page, 500, 500);
    expect((await state(page)).sel).toEqual([]);
    expect(await page.evaluate(() => tool)).toBe('box');   // nothing selected: the tool stays on
  });

  test('a box selects whole groups', async ({ page }) => {
    await page.evaluate(() => { setSel([1, 3]); groupSel(); setSel(null); });
    await page.keyboard.press('m');
    await drag(page, [-20, -20], [120, 100]);   // only the first rect is inside
    expect((await state(page)).sel).toEqual([1, 3]);
  });
});
