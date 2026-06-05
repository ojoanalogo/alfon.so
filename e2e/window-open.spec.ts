import { test, expect } from '@playwright/test';
import { gotoDesktop, openApp, winBox, titlebarBox } from './helpers';

// Real (SSR + hydration) window placement. framer-motion freezes a motion
// element's animatable style props (left/top/width) on hydration, so without the
// motion-value fix a newly-opened, non-centered window stays stuck at the ~(8,8)
// mobile-seed corner with a stale width and jumps to its real origin on grab.

test.beforeEach(async ({ page }) => {
  await gotoDesktop(page);
});

test('a non-centered app opens near center, not stuck in the corner', async ({ page }) => {
  const box = await openApp(page, 'terminal');
  expect(box.x).toBeGreaterThan(150);
  expect(box.y).toBeGreaterThan(40);
  // At its real default width, not the stale mobile-seed width.
  expect(box.width).toBeGreaterThan(450);
});

test('grabbing a freshly-opened window does not make it jump', async ({ page }) => {
  const before = await openApp(page, 'projects');
  const tb = await titlebarBox(page, 'projects');

  // Pointer-down only (no move) — grabbing alone must not move the window. The
  // corner-freeze bug made the window jump ~200px to its gesture origin here.
  await page.mouse.move(tb.x + 30, tb.y + 8);
  await page.mouse.down();
  const afterGrab = await winBox(page, 'projects');
  expect(Math.abs(afterGrab.y - before.y)).toBeLessThanOrEqual(3);
  expect(Math.abs(afterGrab.x - before.x)).toBeLessThanOrEqual(3);

  // And it tracks the drag delta.
  await page.mouse.move(tb.x + 30, tb.y + 8 + 60, { steps: 5 });
  await page.mouse.up();
  const afterDrag = await winBox(page, 'projects');
  expect(Math.abs(afterDrag.y - (before.y + 60))).toBeLessThanOrEqual(8);
});
