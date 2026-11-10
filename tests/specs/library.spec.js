// The Recent popup and the New menus.
const { test, expect } = require('@playwright/test');

async function seed(page, n) {
  await page.evaluate(async n => {
    const c = document.createElement('canvas'); c.width = 400; c.height = 250;
    const x = c.getContext('2d');
    for (let i = 0; i < n; i++) {
      x.fillStyle = `hsl(${i * 9},70%,50%)`; x.fillRect(0, 0, 400, 250);
      await DB.put({ id: 'seed' + i, name: 'Shot ' + i, updated: Date.now() - i * 60000,
        frame: { w: 400, h: 250, ox: 0, oy: 0, bg: '#fff' }, objects: [], thumb: c.toDataURL(), image: await toBlob(c) });
    }
  }, n);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html');
  await seed(page, 40);
  await page.click('#emptyBlank');
});

test('the Recent popup fits the window and scrolls', async ({ page }) => {
  await page.click('#libBtn');
  const grid = page.locator('#libGrid');
  await expect(grid.locator('.card')).toHaveCount(40);
  const box = await page.locator('.sheet').boundingBox();
  expect(box.y + box.height).toBeLessThanOrEqual(900);
  await page.mouse.move(700, 450);
  await page.mouse.wheel(0, 2000);
  await expect.poll(() => grid.evaluate(g => g.scrollTop)).toBeGreaterThan(0);
});

test('removing a recent image asks first', async ({ page }) => {
  await page.click('#libBtn');
  const card = page.locator('#libGrid .card').first();
  await card.hover();
  page.once('dialog', d => d.dismiss());
  await card.locator('.x').click();
  await expect(page.locator('#libGrid .card')).toHaveCount(40);
  await card.hover();
  page.once('dialog', d => d.accept());
  await card.locator('.x').click();
  await expect(page.locator('#libGrid .card')).toHaveCount(39);
});

test('Recent thumbnails show the canvas colour, the checkerboard only when transparent', async ({ page }) => {
  await page.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 400; c.height = 100;
    const rec = (id, bg) => ({ id, name: id, updated: Date.now() + 1000, frame: { w: 400, h: 100, ox: 0, oy: 0, bg },
      objects: [], thumb: c.toDataURL(), image: null });
    await DB.put(rec('dark', '#123456'));
    await DB.put(rec('clear', null));
  });
  await page.reload();
  const thumb = name => page.locator('#emptyRecent .card', { hasText: name }).locator('.thumb');
  await expect(thumb('dark')).toHaveCSS('background-color', 'rgb(18, 52, 86)');
  await expect(thumb('dark')).not.toHaveClass(/checker/);
  await expect(thumb('clear')).toHaveClass(/checker/);
});

test('New menus start documents from the toolbar and the popup', async ({ page }) => {
  await page.click('#newBtn');
  await page.click('#newBtn + .menu >> text=Infinite canvas');
  expect(await page.evaluate(() => isInf())).toBe(true);
  await page.click('#libBtn');
  await page.click('#libNew');
  await page.keyboard.press('Escape');
  await expect(page.locator('#libNew + .menu')).toBeHidden();
  await expect(page.locator('#libModal')).toBeVisible();
  await page.click('#libNew');
  await page.click('#libNew + .menu >> text=Blank canvas');
  await expect(page.locator('#libModal')).toBeHidden();
  expect(await page.evaluate(() => isInf())).toBe(false);
});
