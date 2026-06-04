import { describe, expect, it } from 'vitest';
import { measureGenieTarget } from './useWindowVariants';

function makeBox(rect: Partial<DOMRect>): HTMLElement {
  const el = document.createElement('div');
  el.getBoundingClientRect = () => ({ left: 0, top: 0, width: 0, height: 0, ...rect }) as DOMRect;
  return el;
}

describe('measureGenieTarget', () => {
  it('falls back to a downward slide when the element is missing', () => {
    expect(measureGenieTarget(null, 'a')).toEqual({ dx: 0, dy: 360 });
  });

  it('slides toward the taskbar when no matching tab exists', () => {
    const el = makeBox({ left: 200, top: 100, width: 400, height: 300 });
    const winBottomY = 100 + 300;
    const { dx, dy } = measureGenieTarget(el, 'no-tab');
    expect(dx).toBe(0);
    expect(dy).toBe(window.innerHeight - winBottomY + 48);
  });

  it('targets the center of the matching taskbar tab', () => {
    const tab = makeBox({ left: 500, top: 760, width: 40, height: 30 });
    tab.setAttribute('data-taskbar-window', 'notes');
    document.body.appendChild(tab);

    const el = makeBox({ left: 200, top: 100, width: 400, height: 300 });
    const winCenterX = 200 + 400 / 2;
    const winBottomY = 100 + 300;
    const { dx, dy } = measureGenieTarget(el, 'notes');
    expect(dx).toBe(500 + 40 / 2 - winCenterX);
    expect(dy).toBe(760 + 30 / 2 - winBottomY);

    tab.remove();
  });
});
