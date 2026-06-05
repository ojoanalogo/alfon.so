import { test, expect } from '@playwright/test';
import { gotoDesktop, winBox, waitWindowStable } from './helpers';

// The centering corrector's live resize handling. jsdom can't drive a real
// layout reflow. (A mobile-full-bleed test isn't possible here: the desktop is a
// `client:media="(min-width:40rem)"` island, so below 640px it isn't mounted.)

test.beforeEach(async ({ page }) => {
  await gotoDesktop(page);
});

test('the centered window re-centers when the viewport is resized', async ({ page }) => {
  const center = (box: { x: number; width: number }) => box.x + box.width / 2;

  const wide = await winBox(page, 'about');
  expect(Math.abs(center(wide) - 1440 / 2)).toBeLessThanOrEqual(12); // centered at 1440

  await page.setViewportSize({ width: 1000, height: 800 });
  await waitWindowStable(page, 'about');

  const narrow = await winBox(page, 'about');
  // Re-centered to the new viewport (still desktop, so not full-bleed).
  expect(Math.abs(center(narrow) - 1000 / 2)).toBeLessThanOrEqual(12);
});
