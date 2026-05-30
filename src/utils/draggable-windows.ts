let topZ = 10;

function focusWindow(windowEl: HTMLElement) {
  topZ += 1;
  windowEl.style.zIndex = String(topZ);
}

function parsePx(value: string) {
  return Number.parseFloat(value) || 0;
}

function ensureAbsolutePosition(windowEl: HTMLElement) {
  if (windowEl.dataset.positioned === 'true') return;

  const rect = windowEl.getBoundingClientRect();
  const useFixed = windowEl.dataset.draggableFixed !== undefined;

  if (useFixed) {
    windowEl.style.position = 'fixed';
    windowEl.style.left = `${rect.left}px`;
    windowEl.style.top = `${rect.top}px`;
    windowEl.style.width = `${rect.width}px`;
  } else {
    const parent = windowEl.offsetParent as HTMLElement | null;
    const parentRect = parent?.getBoundingClientRect() ?? { left: 0, top: 0 };

    windowEl.style.position = 'absolute';
    windowEl.style.left = `${rect.left - parentRect.left + (parent?.scrollLeft ?? 0)}px`;
    windowEl.style.top = `${rect.top - parentRect.top + (parent?.scrollTop ?? 0)}px`;
    windowEl.style.width = `${rect.width}px`;
  }

  windowEl.dataset.positioned = 'true';
}

function getOrigin(windowEl: HTMLElement) {
  if (windowEl.style.position === 'fixed') {
    return {
      x: parsePx(windowEl.style.left),
      y: parsePx(windowEl.style.top),
    };
  }

  return {
    x: windowEl.offsetLeft,
    y: windowEl.offsetTop,
  };
}

export function initDraggableWindows() {
  const windows = document.querySelectorAll<HTMLElement>('[data-draggable-window]');

  windows.forEach((windowEl) => {
    if (windowEl.dataset.draggableInit === 'true') return;
    windowEl.dataset.draggableInit = 'true';

    const handle = windowEl.querySelector<HTMLElement>('[data-drag-handle]');
    if (!handle) return;

    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let originX = 0;
    let originY = 0;

    windowEl.addEventListener('pointerdown', (event) => {
      if ((event.target as HTMLElement).closest('.window-controls, .theme-toggle')) return;
      focusWindow(windowEl);
    });

    handle.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      if ((event.target as HTMLElement).closest('.window-controls, .theme-toggle, [data-window-close], [data-window-minimize], [data-window-maximize]')) {
        return;
      }

      ensureAbsolutePosition(windowEl);

      pointerId = event.pointerId;
      handle.setPointerCapture(pointerId);
      focusWindow(windowEl);

      startX = event.clientX;
      startY = event.clientY;

      const origin = getOrigin(windowEl);
      originX = origin.x;
      originY = origin.y;

      handle.classList.add('cursor-grabbing');
      event.preventDefault();
    });

    const endDrag = (event: PointerEvent) => {
      if (pointerId === null || event.pointerId !== pointerId) return;

      handle.releasePointerCapture(pointerId);
      pointerId = null;
      handle.classList.remove('cursor-grabbing');
    };

    handle.addEventListener('pointermove', (event) => {
      if (pointerId === null || event.pointerId !== pointerId) return;

      const dx = event.clientX - startX;
      const dy = event.clientY - startY;

      windowEl.style.left = `${originX + dx}px`;
      windowEl.style.top = `${originY + dy}px`;
    });

    handle.addEventListener('pointerup', endDrag);
    handle.addEventListener('pointercancel', endDrag);
  });
}
