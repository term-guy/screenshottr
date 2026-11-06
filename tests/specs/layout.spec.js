// The toolbar and panel stay inside the window at any width.
const { test, expect } = require('@playwright/test');
const { openApp } = require('./helpers');

const measure = page => page.evaluate(() => {
  const out = document.querySelectorAll('header button, header input:not([hidden]), header #dims, header .brand');
  return {
    win: innerWidth,
    docW: document.documentElement.scrollWidth,
    scrolled: document.documentElement.scrollLeft + document.body.scrollLeft,
    panelRight: document.querySelector('aside').getBoundingClientRect().right,
    headerH: document.querySelector('header').getBoundingClientRect().height,
    clipped: [...out].filter(e => e.offsetParent && !e.closest('.menu')).filter(e => {
      const r = e.getBoundingClientRect();
      return r.left < 0 || r.right > innerWidth;
    }).map(e => e.id || e.title || e.textContent),
    stageH: document.querySelector('#stage').getBoundingClientRect().height,
    stageBottom: document.querySelector('#stage').getBoundingClientRect().bottom,
  };
});

for (const kind of ['infinite', 'blank']) {
  for (const width of [1920, 1500, 1446, 1400, 1360, 1200, 1000, 700, 420]) {
    test(`${kind} canvas at ${width}px: nothing overflows the window`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await openApp(page, kind);
      const m = await measure(page);
      expect(m.docW).toBe(width);
      expect(m.scrolled).toBe(0);
      expect(m.panelRight).toBe(width);
      expect(m.clipped).toEqual([]);
      expect(m.stageBottom).toBe(900);
      if (width >= 1200) expect(m.headerH).toBe(48);   // one row at ordinary window sizes
    });
  }
}

test('the toolbar New menu stays in the window on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 700, height: 900 });
  await openApp(page, 'blank');
  await page.click('#newBtn');
  const box = await page.locator('header .menu').boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(700);
});

test('an infinite canvas fills the stage after the toolbar wraps', async ({ page }) => {
  await page.setViewportSize({ width: 700, height: 900 });
  await openApp(page);
  const r = await page.evaluate(async () => {
    await new Promise(r => requestAnimationFrame(r));
    const c = cv.getBoundingClientRect(), s = stage.getBoundingClientRect();
    return { cw: cv.width / DPR(), ch: cv.height / DPR(), sw: s.width, sh: s.height, h: c.height };
  });
  expect(r.ch).toBe(r.sh);
  expect(r.cw).toBe(r.sw);
});
