// Copy and paste between two instances (tabs) of the app.
const { test, expect } = require('@playwright/test');
const { openApp, addObjects, state, noErrors } = require('./helpers');

test('copies styled text and image objects to another tab', async ({ context }) => {
  const a = await openApp(await context.newPage());
  const b = await openApp(await context.newPage());
  await a.bringToFront();
  await a.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 64; c.height = 32;
    c.getContext('2d').fillRect(0, 0, 64, 32);
    await addImageObject(await toBlob(c));
    Object.assign(sel(), { w: 128, h: 64 });
    newObj('text', { x: 300, y: 10, text: 'Hello\nworld', color: '#00ff00', fontSize: 40 });
    setSel(objects.map(o => o.id));
  });
  await a.keyboard.press('ControlOrMeta+c');
  // other apps get the plain text when only text is copied; here it's mixed, so the JSON payload
  await b.bringToFront();
  await b.keyboard.press('ControlOrMeta+v');
  await expect.poll(async () => (await state(b)).objects.length).toBe(2);
  const s = await state(b);
  expect(s.objects[0]).toMatchObject({ type: 'image', w: 128, h: 64, iw: 64 });
  expect(await b.evaluate(src => assets.has(src), s.objects[0].src)).toBe(true);
  expect(s.objects[1]).toMatchObject({ type: 'text', text: 'Hello\nworld', color: '#00ff00', fontSize: 40 });
  expect(s.sel).toHaveLength(2);
  expect(s.last).toBe('Paste 2 objects');
  noErrors(a); noErrors(b);
});

test('a copied text object pastes as plain text elsewhere', async ({ page }) => {
  await openApp(page);
  await addObjects(page, [['text', { x: 0, y: 0, text: 'Just words' }]]);
  await page.evaluate(() => setSel(objects[0].id));
  await page.keyboard.press('ControlOrMeta+c');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('Just words');
});

test('external plain text becomes a text object in the current style', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => navigator.clipboard.writeText('from elsewhere'));
  await page.keyboard.press('ControlOrMeta+v');
  await expect.poll(async () => (await state(page)).objects.map(o => o.text)).toEqual(['from elsewhere']);
  noErrors(page);
});
