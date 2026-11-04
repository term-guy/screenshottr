// Shared helpers. The app is one classic script, so its top-level functions and `let`
// state (objects, selIds, zoom, ...) are reachable from page.evaluate by name.
const { expect } = require('@playwright/test');

async function openApp(page, kind = 'infinite') {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/index.html');
  await page.click(kind === 'infinite' ? '#emptyInfinite' : '#emptyBlank');
  // Fixed view for predictable coordinates: 100% zoom, world (0, 0) 100px inside the canvas.
  if (kind === 'infinite') await page.evaluate(() => { setZoom(1); viewX = -100; viewY = -100; render(); });
  page.errors = errors;
  return page;
}
// Screen position of a world point.
function screen(page, x, y) {
  return page.evaluate(([x, y]) => {
    const r = cv.getBoundingClientRect();
    if (isInf()) return { x: r.left + (x - viewX) * zoom, y: r.top + (y - viewY) * zoom };
    return { x: r.left + x * (r.width / frame.w), y: r.top + y * (r.height / frame.h) };
  }, [x, y]);
}
async function click(page, x, y, mods = []) {
  const p = await screen(page, x, y);
  for (const m of mods) await page.keyboard.down(m);
  await page.mouse.click(p.x, p.y);
  for (const m of mods) await page.keyboard.up(m);
}
async function drag(page, from, to, mods = [], steps = 8) {
  const a = await screen(page, ...from), b = await screen(page, ...to);
  for (const m of mods) await page.keyboard.down(m);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y, { steps });
  await page.mouse.up();
  for (const m of mods) await page.keyboard.up(m);
}
// Add objects directly (as one undo step) and clear the selection.
function addObjects(page, list) {
  return page.evaluate(list => {
    for (const [type, props] of list) newObj(type, props);
    setSel(null); pushHistory('test setup'); render();
  }, list);
}
const state = page => page.evaluate(() => ({
  objects: clone(objects), sel: [...selIds], last: hist[hIdx] && hist[hIdx].label,
  title: document.querySelector('#propsTitle').textContent,
}));
const noErrors = page => expect(page.errors, 'page errors').toEqual([]);

module.exports = { openApp, screen, click, drag, addObjects, state, noErrors };
