let topZ = 10;
let focusTabHandler: ((windowId: string) => void) | null = null;

export function setWindowFocusTabHandler(handler: (windowId: string) => void) {
  focusTabHandler = handler;
}

export function focusWindow(windowEl: HTMLElement) {
  topZ += 1;
  windowEl.style.zIndex = String(topZ);

  const windowId = windowEl.dataset.windowId;
  if (windowId && focusTabHandler) focusTabHandler(windowId);
}

export function initDefaultWindowFocus() {
  const defaultWindow = document.querySelector<HTMLElement>(
    '[data-draggable-window][data-window-open="true"]',
  );
  if (defaultWindow) focusWindow(defaultWindow);
}
