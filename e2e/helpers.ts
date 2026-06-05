import { expect, type Page, type Locator } from '@playwright/test';

/** Navigate to the desktop and wait until it has hydrated + placed its windows. */
export async function gotoDesktop(page: Page) {
  await page.goto('/');
  await page.waitForSelector('[data-window-id="about"]');
  // The centered `about` window is placed (not at the top-left seed) only after
  // hydration + the mount-sync/centering pass — a reliable "ready" signal.
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-window-id="about"]');
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.left > 50 && r.top > 20;
  });
}

function win(page: Page, id: string): Locator {
  return page.locator(`[data-window-id="${id}"]`);
}

/** Open a closed app by id (icon id === window id) and wait until it's placed. */
export async function openApp(page: Page, id: string) {
  await page.locator(`[data-icon-id="${id}"]`).dblclick();
  await win(page, id).waitFor({ state: 'visible' });
  await waitWindowStable(page, id);
  return winBox(page, id);
}

/**
 * Wait until a window is placed near-center (not the corner seed) AND its frame
 * is stable across two consecutive polls — the open/width-sync passes settle over
 * a few frames, so measuring too early captures a transient position.
 */
export async function waitWindowStable(page: Page, id: string) {
  await page.waitForFunction((wid) => {
    const el = document.querySelector(`[data-window-id="${wid}"]`);
    if (!el) return false;
    const r = el.getBoundingClientRect();
    if (r.left <= 50) return false;
    const key = `${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.width)},${Math.round(r.height)}`;
    const store = ((window as unknown as { __winKeys?: Record<string, string> }).__winKeys ??= {});
    const stable = store[wid] === key;
    store[wid] = key;
    return stable;
  }, id);
}

/** Bounding box of a window (throws if missing). */
export async function winBox(page: Page, id: string) {
  const box = await win(page, id).boundingBox();
  expect(box, `window ${id} should have a box`).not.toBeNull();
  return box!;
}

/** Live inline left/top (the non-animated base position framer writes via motion values). */
export function stylePos(page: Page, id: string) {
  return page.evaluate((wid) => {
    const el = document.querySelector(`[data-window-id="${wid}"]`) as HTMLElement | null;
    return el ? { left: el.style.left, top: el.style.top } : null;
  }, id);
}

/** Resolved z-index of a window (for stacking assertions). */
export function zIndexOf(page: Page, id: string) {
  return page.evaluate((wid) => {
    const el = document.querySelector(`[data-window-id="${wid}"]`);
    return el ? parseInt(getComputedStyle(el).zIndex || '0', 10) : 0;
  }, id);
}

/** Titlebar drag-region box of a window. */
export async function titlebarBox(page: Page, id: string) {
  const box = await win(page, id).locator('.window-titlebar__drag').boundingBox();
  expect(box, `titlebar of ${id}`).not.toBeNull();
  return box!;
}
