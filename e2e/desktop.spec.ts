import { test, expect } from '@playwright/test';
import { gotoDesktop, openApp } from './helpers';

const isDark = (page: import('@playwright/test').Page) =>
  page.evaluate(() => document.documentElement.classList.contains('dark'));

test.describe('theme persistence', () => {
  test('selecting a theme from the taskbar dropdown persists across reload', async ({ page }) => {
    await gotoDesktop(page);
    const before = await isDark(page);

    const themeTrigger = page.locator(
      '[aria-label="Bandeja del sistema"] [data-tooltip="Cambiar tema"]',
    );
    await themeTrigger.click();
    await page.getByRole('option', { name: before ? 'Claro' : 'Oscuro' }).click();
    const toggled = await isDark(page);
    expect(toggled).not.toBe(before);
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBeTruthy();

    // Reload: the inline <head> bootstrap must apply the stored theme during HTML
    // parse — before the React island hydrates — so there is no flash.
    await page.reload({ waitUntil: 'domcontentloaded' });
    expect(await isDark(page)).toBe(toggled);
  });
});

test.describe('desktop interactions', () => {
  test.beforeEach(async ({ page }) => {
    await gotoDesktop(page);
  });

  test('an app keeps its state across close and reopen', async ({ page }) => {
    await openApp(page, 'terminal');
    const input = page.locator('#terminal-input');
    await input.click();
    await input.fill('zzqqxx');
    await input.press('Enter');

    const term = page.locator('[data-window-id="terminal"]');
    await expect(term).toContainText('zzqqxx'); // the command echoes into history

    // Close — the body stays mounted (wasOpened latch), so its state survives.
    await page.locator('[data-window-id="terminal"] [aria-label="Cerrar ventana"]').click();
    await openApp(page, 'terminal');

    await expect(page.locator('[data-window-id="terminal"]')).toContainText('zzqqxx');
  });

  test('dragging a desktop icon onto the trash removes it', async ({ page }) => {
    const icon = page.locator('[data-icon-id="notes"]');
    await expect(icon).toBeVisible();
    const ib = (await icon.boundingBox())!;
    const tb = (await page.locator('[aria-label="Papelera"]').boundingBox())!;

    await page.mouse.move(ib.x + ib.width / 2, ib.y + ib.height / 2);
    await page.mouse.down();
    // Pass the drag threshold, then drop over the trash.
    await page.mouse.move(ib.x + ib.width / 2 + 12, ib.y + ib.height / 2 + 12, { steps: 3 });
    await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2, { steps: 10 });
    await page.mouse.up();

    await expect(page.locator('[data-icon-id="notes"]')).toHaveCount(0);
  });
});
