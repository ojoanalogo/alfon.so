import { test, expect, type Page } from '@playwright/test';

// Reproduces the real (SSR + hydration) window placement. framer-motion freezes
// a motion element's animatable style props (left/top/width) on hydration, so
// without the motion-value fix a newly-opened, non-centered window stays stuck at
// the ~(8,8) mobile-seed corner with a stale width, then jumps to its real
// near-center origin on the first drag.

async function openAndMeasure(page: Page, iconLabel: string, windowId: string) {
  await page.locator(`[aria-label="${iconLabel}"]`).first().dblclick();
  await page.waitForTimeout(700);
  const box = await page.locator(`[data-window-id="${windowId}"]`).boundingBox();
  expect(box, `window ${windowId} should be rendered`).not.toBeNull();
  return box!;
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // Let the desktop hydrate and the mount-sync/relayout settle.
  await page.waitForSelector('[data-window-id="about"]');
  await page.waitForTimeout(1200);
});

test('a non-centered app opens near center, not stuck in the corner', async ({ page }) => {
  const box = await openAndMeasure(page, 'Terminal', 'terminal');
  // The framer-freeze bug parked it at ~(8,8); placement is near-center.
  expect(box.x).toBeGreaterThan(150);
  expect(box.y).toBeGreaterThan(40);
  // And at its real default width, not the stale mobile-seed width.
  expect(box.width).toBeGreaterThan(450);
});

test('grabbing a freshly-opened window does not make it jump', async ({ page }) => {
  const before = await openAndMeasure(page, 'Mis proyectos', 'projects');
  const titlebar = page.locator('[data-window-id="projects"] .window-titlebar__drag').first();
  const tb = (await titlebar.boundingBox())!;

  // Grab only — the window must not jump from where it was rendered.
  await page.mouse.move(tb.x + 30, tb.y + 8);
  await page.mouse.down();
  await page.mouse.move(tb.x + 31, tb.y + 9, { steps: 2 });
  const afterGrab = (await page.locator('[data-window-id="projects"]').boundingBox())!;
  expect(Math.abs(afterGrab.y - before.y)).toBeLessThanOrEqual(4);
  expect(Math.abs(afterGrab.x - before.x)).toBeLessThanOrEqual(4);

  // And it tracks the drag delta.
  await page.mouse.move(tb.x + 30, tb.y + 8 + 60, { steps: 4 });
  await page.mouse.up();
  const afterDrag = (await page.locator('[data-window-id="projects"]').boundingBox())!;
  expect(Math.abs(afterDrag.y - (before.y + 60))).toBeLessThanOrEqual(6);
});
