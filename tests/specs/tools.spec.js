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

test('infinite canvas: the grid can be hidden and shown again, with undo', async ({ page }) => {
  await openApp(page);
  const toggle = page.locator('#props .row:has-text("Show grid") .switch');
  // A canvas pixel that sits on a grid dot at 100% zoom (world 0,0 is 100px in).
  const dot = () => page.evaluate(async () => {
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const d = DPR(), p = ctx.getImageData(Math.round(100 * d), Math.round(100 * d), 1, 1).data;
    return p[0] < 250;
  });
  await expect(toggle).toHaveClass(/\bon\b/);
  expect(await dot()).toBe(true);
  await toggle.click();
  await expect(toggle).not.toHaveClass(/\bon\b/);
  expect(await page.evaluate(() => frame.noGrid)).toBe(true);
  expect((await state(page)).last).toBe('Hide grid');
  expect(await dot()).toBe(false);
  await page.keyboard.press('ControlOrMeta+z');
  expect(await page.evaluate(() => !!frame.noGrid)).toBe(false);
  expect(await dot()).toBe(true);
  noErrors(page);
});

test('blank canvas has no grid switch', async ({ page }) => {
  await openApp(page, 'blank');
  await page.keyboard.press('v');
  await expect(page.locator('#props .row:has-text("Show grid")')).toHaveCount(0);
});

test.describe('converting between regular and infinite canvases', () => {
  const info = page => page.evaluate(() => ({
    inf: isInf(), w: frame.w, h: frame.h, cls: document.body.classList.contains('infinite'),
    objs: clone(objects), last: hist[hIdx].label, label: document.querySelector('#convertBtn')?.textContent,
    dims: document.querySelector('#dims').textContent,
  }));
  const rect = { x: 100, y: 200, w: 300, h: 100 };
  const opaque = (page, x, y) => page.evaluate(([x, y]) => {
    return exportCanvas().getContext('2d').getImageData(x, y, 1, 1).data[3] > 0;
  }, [x, y]);

  test('regular to infinite keeps objects in place, and undo restores the canvas', async ({ page }) => {
    await openApp(page, 'blank');
    await addObjects(page, [['rect', rect]]);
    await expect(page.locator('#convertBtn')).toHaveText('Convert to infinite canvas');
    await page.click('#convertBtn');
    let s = await info(page);
    expect(s).toMatchObject({ inf: true, cls: true, dims: 'Infinite canvas', last: 'Convert to infinite canvas', label: 'Convert to regular canvas' });
    expect(s.objs[0]).toMatchObject(rect);
    await page.keyboard.press('ControlOrMeta+z');
    s = await info(page);
    expect(s).toMatchObject({ inf: false, cls: false, w: 1600, h: 1000, dims: '1600 × 1000', label: 'Convert to infinite canvas' });
    expect(s.objs[0]).toMatchObject(rect);
    const css = await page.evaluate(() => ({ w: parseFloat(getComputedStyle(cv).width), z: zoom, bw: cv.width }));
    expect(css.bw).toBe(1600);
    expect(css.w).toBeCloseTo(1600 * css.z, 0);
    await page.keyboard.press('ControlOrMeta+Shift+z');
    expect((await info(page)).inf).toBe(true);
    noErrors(page);
  });

  test('infinite to regular fits all objects like an export would, and undo restores them', async ({ page }) => {
    await openApp(page);
    await addObjects(page, [['rect', { x: -500, y: -300, w: 200, h: 100 }], ['rect', { x: 600, y: 400, w: 100, h: 100 }]]);
    const before = await page.evaluate(() => { const c = exportCanvas(); return { w: c.width, h: c.height }; });
    await page.click('#convertBtn');
    const s = await info(page);
    expect(s).toMatchObject({ inf: false, cls: false, w: before.w, h: before.h, last: 'Convert to regular canvas' });
    expect(await page.evaluate(() => { const c = exportCanvas(); return [c.width, c.height]; })).toEqual([before.w, before.h]);
    expect(s.objs[0].x).toBeGreaterThanOrEqual(0);
    expect(s.objs[0].y).toBeGreaterThanOrEqual(0);
    // The canvas tool works on the result: "Fit to image" must not collapse it to the old 1x1 base.
    expect(await page.evaluate(() => [base.width, base.height])).toEqual([before.w, before.h]);
    await page.keyboard.press('ControlOrMeta+z');
    const u = await info(page);
    expect(u.inf).toBe(true);
    expect(u.objs[0]).toMatchObject({ x: -500, y: -300 });
    noErrors(page);
  });

  test('an empty infinite canvas becomes a default blank canvas', async ({ page }) => {
    await openApp(page);
    await page.click('#convertBtn');
    expect(await info(page)).toMatchObject({ inf: false, w: 1600, h: 1000 });
    noErrors(page);
  });

  test('refuses content too large for a regular canvas and changes nothing', async ({ page }) => {
    await openApp(page);
    await addObjects(page, [['rect', { x: 0, y: 0, w: 100, h: 100 }], ['rect', { x: 20000, y: 0, w: 100, h: 100 }]]);
    await page.click('#convertBtn');
    await expect(page.locator('#toast')).toContainText('Too large');
    const s = await info(page);
    expect(s.inf).toBe(true);
    expect(s.objs[0]).toMatchObject({ x: 0, y: 0 });
    expect(s.last).toBe('test setup');
    noErrors(page);
  });

  test('from the canvas tool: leaves the tool, and undo works while it was active', async ({ page }) => {
    await openApp(page, 'blank');
    await page.keyboard.press('c');
    await page.click('#convertBtn');
    await expect(page.locator('.tool[data-tool="canvas"]')).not.toHaveClass(/\bon\b/);
    await expect(page.locator('.tool[data-tool="select"]')).toHaveClass(/\bon\b/);
    await expect(page.locator('#frameBox')).toBeHidden();
    await page.keyboard.press('ControlOrMeta+z');
    await page.keyboard.press('c');
    await page.keyboard.press('ControlOrMeta+Shift+z');   // redo into infinite with the canvas tool on
    await expect(page.locator('.tool[data-tool="canvas"]')).not.toHaveClass(/\bon\b/);
    await expect(page.locator('#frameBox')).toBeHidden();
    noErrors(page);
  });

  test('a screenshot held in the base image of an older document survives conversion', async ({ page }) => {
    await page.goto('/index.html');
    page.errors = [];
    page.on('pageerror', e => page.errors.push(e.message));
    await page.evaluate(() => {
      const c = document.createElement('canvas'); c.width = 200; c.height = 100;
      const x = c.getContext('2d'); x.fillStyle = '#ff0000'; x.fillRect(0, 0, 200, 100);
      openDoc(c, { name: 'Old', frame: { w: 300, h: 200, ox: 50, oy: 40, bg: null } });
    });
    await page.keyboard.press('v');
    await page.click('#convertBtn');
    const s = await info(page);
    expect(s.objs).toHaveLength(1);
    expect(s.objs[0]).toMatchObject({ type: 'image', x: 50, y: 40, w: 200, h: 100 });
    expect(await opaque(page, 100, 50)).toBe(true);
    // Project saving still finds the pixels.
    expect(Object.keys(await page.evaluate(async () => usedAssets(objects)))).toHaveLength(1);
    await page.keyboard.press('ControlOrMeta+z');
    expect((await info(page)).objs).toHaveLength(0);
    expect(await opaque(page, 100, 60)).toBe(true);
    noErrors(page);
  });

  test('a conversion is what autosave stores in the library', async ({ page }) => {
    await openApp(page);
    await addObjects(page, [['rect', rect]]);
    await page.click('#convertBtn');
    const id = await page.evaluate(async () => { await saveDoc(); return docId; });
    const rec = await page.evaluate(id => DB.get(id).then(r => ({ inf: !!r.frame.infinite, w: r.frame.w, name: r.name })), id);
    expect(rec.inf).toBe(false);
    expect(rec.w).toBe((await info(page)).w);
    expect(rec.name).toBe('Blank canvas');
    noErrors(page);
  });
});
