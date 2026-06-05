import { test, expect } from '@playwright/test';
import { gotoDesktop, openApp, winBox, stylePos, zIndexOf } from './helpers';

// Real-browser windowing behaviors that jsdom can't exercise: z-order stacking,
// the maximize/restore animation (and the motion-value maximize gating), the
// minimize→taskbar→restore round-trip, and resizing via a real handle drag.

test.beforeEach(async ({ page }) => {
  await gotoDesktop(page);
});

test('focusing a background window via the taskbar brings it to the front', async ({ page }) => {
  await openApp(page, 'terminal');
  await openApp(page, 'projects'); // opened later → stacks on top

  expect(await zIndexOf(page, 'projects')).toBeGreaterThan(await zIndexOf(page, 'terminal'));
  const projZ = await zIndexOf(page, 'projects');

  // Taskbar tabs never overlap, so this reliably focuses the background window.
  await page.locator('[data-taskbar-window="terminal"]').click();
  await expect.poll(() => zIndexOf(page, 'terminal')).toBeGreaterThan(projZ);
});

test('maximize fills the screen; restore returns to the prior position', async ({ page }) => {
  const before = await openApp(page, 'terminal');
  const btn = page.locator('[data-window-id="terminal"] [aria-label="Maximizar ventana"]');

  await btn.click();
  // Poll for the SETTLED maximized frame (x→0 only after the 0.32s transition).
  await expect.poll(async () => Math.round((await winBox(page, 'terminal')).x)).toBeLessThanOrEqual(2);
  const max = await winBox(page, 'terminal');
  expect(max.width).toBeGreaterThan(1000); // full-bleed
  expect(max.y).toBeLessThanOrEqual(2);

  await btn.click(); // restore
  // The restored frame must match where it was before maximizing (guards the
  // motion-value maximize gating — restore re-applies the stored position).
  await expect
    .poll(async () => Math.abs((await winBox(page, 'terminal')).x - before.x))
    .toBeLessThanOrEqual(2);
  const restored = await winBox(page, 'terminal');
  expect(Math.abs(restored.width - before.width)).toBeLessThanOrEqual(2);
});

test('minimize hides the window to the taskbar; restoring keeps its position', async ({ page }) => {
  await openApp(page, 'terminal');
  const posBefore = await stylePos(page, 'terminal');

  await page.locator('[data-window-id="terminal"] [aria-label="Minimizar ventana"]').click();
  // Minimized windows are inert (not interactive).
  await expect
    .poll(() => page.locator('[data-window-id="terminal"]').getAttribute('inert'))
    .not.toBeNull();

  // Restore via the taskbar tab.
  await page.locator('[data-taskbar-window="terminal"]').click();
  await expect
    .poll(() => page.locator('[data-window-id="terminal"]').getAttribute('inert'))
    .toBeNull();

  // The stored base position (the non-animated inline left/top) is preserved.
  expect(await stylePos(page, 'terminal')).toEqual(posBefore);
});

test('dragging the south-east resize handle grows the window', async ({ page }) => {
  const before = await openApp(page, 'terminal');
  const handle = page.locator('[data-window-id="terminal"] .desktop-window__resize--se');
  const h = await handle.boundingBox();
  expect(h).not.toBeNull();

  const cx = h!.x + h!.width / 2;
  const cy = h!.y + h!.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 120, cy + 90, { steps: 6 });
  await page.mouse.up();

  const after = await winBox(page, 'terminal');
  expect(after.width).toBeGreaterThan(before.width + 40);
  expect(after.height).toBeGreaterThan(before.height + 30);
});
