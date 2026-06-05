import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import { useMemo } from 'react';
import Window from '@desktop/window/Window';
import { useWindowManager } from '@desktop/state/useWindowManager';
import { useResponsiveLayout } from '@desktop/state/useResponsiveLayout';
import type { WindowDef, WindowGeometry } from '@desktop/types';

// Real-browser regression for the centered-window drag jump. jsdom cannot model
// layout + framer-motion + window-level pointer bubbling, which is exactly what
// this test exercises: the `about` window is centered + content-sized (the case
// that diverged), a second window is open (so `about` is not focused), and we
// drive a real pointer drag and assert the window never jumps.

const DEFS: WindowDef[] = [
  {
    id: 'about',
    title: 'about',
    defaultX: 0,
    defaultY: 0,
    defaultWidth: 560,
    minWidth: 520,
    initialZ: 11,
    center: true,
    defaultOpen: true,
  },
  {
    id: 'term',
    title: 'term',
    defaultX: 0,
    defaultY: 0,
    defaultWidth: 600,
    initialZ: 12,
    defaultOpen: true,
  },
  {
    // A non-centered app that starts CLOSED — opened on demand to exercise the
    // open-a-closed-window placement path.
    id: 'notes',
    title: 'notes',
    defaultX: 0,
    defaultY: 0,
    defaultWidth: 600,
    initialZ: 13,
    defaultOpen: false,
  },
];

function Harness() {
  const wm = useWindowManager(DEFS, window.innerWidth, window.innerHeight);
  const viewport = useMemo(() => ({ width: window.innerWidth, height: window.innerHeight }), []);
  const { openWindow } = useResponsiveLayout(wm, DEFS, viewport);
  return (
    <>
      {/* The project CSS (which makes .desktop-window position:absolute) is not
          loaded here; inject the one rule positioning depends on. */}
      <style>{`.desktop-window { position: absolute; } .window-titlebar__drag { touch-action: none; }`}</style>
      <button data-testid="open-notes" onClick={() => openWindow('notes')}>
        open notes
      </button>
      <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
        {DEFS.map((def) => {
          const state = wm.windows[def.id];
          return (
            <Window
              key={def.id}
              state={state}
              title={def.title}
              focused={wm.focusedId === def.id}
              minWidth={def.minWidth ?? 400}
              defaultWidth={def.defaultWidth}
              center={def.center}
              onFocus={() => wm.focus(def.id)}
              onClose={() => wm.close(def.id)}
              onMinimize={() => wm.minimize(def.id)}
              onToggleMaximize={() => wm.toggleMaximize(def.id)}
              onGeometryChange={(geometry: Partial<WindowGeometry>, intent: 'user' | 'auto') =>
                intent === 'user'
                  ? wm.setUserGeometry(def.id, geometry)
                  : wm.correctLayout(def.id, geometry)
              }
            >
              <div style={{ padding: 24 }}>{def.id} body content for measuring</div>
            </Window>
          );
        })}
      </div>
    </>
  );
}

function topOf(el: Element): number {
  return Math.round(el.getBoundingClientRect().top);
}

// Drive the real gesture with native PointerEvents. The browser env gives real
// layout (jsdom returns zero rects) and real event bubbling: pointerdown on the
// titlebar reaches React's handler; pointermove/up reach useWindowGestures'
// window-level listeners.
function down(target: Element, x: number, y: number) {
  target.dispatchEvent(
    new PointerEvent('pointerdown', { bubbles: true, clientX: x, clientY: y, button: 0, pointerId: 1 }),
  );
}
function move(x: number, y: number) {
  window.dispatchEvent(
    new PointerEvent('pointermove', { bubbles: true, clientX: x, clientY: y, button: 0, pointerId: 1 }),
  );
}
function up() {
  window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, pointerId: 1 }));
}
const tick = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));

describe('about window drag (real browser)', () => {
  it('does not jump when grabbed; tracks the drag delta', async () => {
    const screen = await render(<Harness />);
    const about = screen.container.querySelector('[data-window-id="about"]') as HTMLElement;
    expect(about).toBeTruthy();

    // First-paint correctness: the centered frame must be committed before paint
    // (the corrector reports in a layout effect), so there is no settle flicker.
    const firstPaintTop = topOf(about);
    await new Promise((r) => setTimeout(r, 150));
    const settledTop = topOf(about);
    expect(Math.abs(firstPaintTop - settledTop)).toBeLessThanOrEqual(1);

    const titlebar = about.querySelector('.window-titlebar__drag') as HTMLElement;
    const s = titlebar.getBoundingClientRect();
    const gx = s.x + 20;
    const gy = s.y + 10;

    // GRAB ONLY (pointerdown, no move). This is the exact moment the old bug
    // flicked the window from displayPos to a stale state.y. With single-source
    // geometry the grab changes nothing, so top must be unchanged.
    down(titlebar, gx, gy);
    await tick();
    const afterGrabTop = topOf(about);
    expect(Math.abs(afterGrabTop - settledTop)).toBeLessThanOrEqual(2);

    // Drag down by a clear delta; the window must track it (not jump).
    const DY = 60;
    move(gx, gy + DY);
    await tick();
    const afterMoveTop = topOf(about);
    expect(Math.abs(afterMoveTop - (settledTop + DY))).toBeLessThanOrEqual(3);
    up();
    await tick();

    // Re-grab: a second grab must also not jump (the stale-displayPos re-grab bug).
    const beforeSecond = topOf(about);
    down(titlebar, gx, gy + DY);
    await tick();
    expect(Math.abs(topOf(about) - beforeSecond)).toBeLessThanOrEqual(2);
    up();
  });

  // Placement smoke test for the open-a-closed-window path: it lands near-center
  // at its real default width. NOTE: this does NOT reproduce the framer-motion
  // *hydration* freeze that parked real (SSR-rendered) windows in the corner —
  // that needs a full-page e2e and is covered by the manual Playwright check.
  it('opens a closed non-centered app near center at its default width', async () => {
    const screen = await render(<Harness />);
    (screen.container.querySelector('[data-testid="open-notes"]') as HTMLElement).click();
    await new Promise((r) => setTimeout(r, 250));
    const notes = screen.container.querySelector('[data-window-id="notes"]') as HTMLElement;
    expect(notes).toBeTruthy();
    const r = notes.getBoundingClientRect();
    expect(Math.round(r.left)).toBeGreaterThan(120);
    expect(Math.round(r.top)).toBeGreaterThan(40);
    expect(Math.round(r.width)).toBeGreaterThan(450);
  });
});
