import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { WindowManager } from './useWindowManager';
import type { WindowDef, WindowGeometry } from '../types';
import { mobileWindowGeometry } from '../lib/viewport';
import { isMobileViewport } from '../lib/layoutConstants';

export function useResponsiveLayout(
  wm: WindowManager,
  defs: WindowDef[],
  viewport: { width: number; height: number },
): { openWindow: (id: string) => void; fitWindowToMobile: (id: string) => void } {
  const { setGeometry, setGeometries, relayoutToViewport, applyDefaultOpenLayout } = wm;
  const [layoutEpoch, setLayoutEpoch] = useState(0);

  // Read window state inside the relayout effect without making it a dependency:
  // otherwise a drag (which mutates wm.windows on every pointer move) re-fires
  // the effect, which clamps x/y back to defaults and fights the drag.
  const windowsRef = useRef(wm.windows);
  useLayoutEffect(() => {
    windowsRef.current = wm.windows;
  });

  useEffect(() => {
    function bumpLayout() {
      setLayoutEpoch((epoch) => epoch + 1);
    }
    window.addEventListener('resize', bumpLayout);
    window.visualViewport?.addEventListener('resize', bumpLayout);
    // One more pass after the first paint when innerWidth/Height are reliable.
    const frame = requestAnimationFrame(bumpLayout);
    void document.fonts?.ready.then(bumpLayout);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', bumpLayout);
      window.visualViewport?.removeEventListener('resize', bumpLayout);
    };
  }, []);

  const fitWindowToMobile = useCallback(
    (id: string) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const mobile = mobileWindowGeometry(vw, vh);
      setGeometry(id, mobile);
    },
    [setGeometry],
  );

  const openWindow = useCallback(
    (id: string) => {
      flushSync(() => {
        wm.open(id);
      });
      if (isMobileViewport()) {
        fitWindowToMobile(id);
        return;
      }
      flushSync(() => {
        applyDefaultOpenLayout(id);
      });
    },
    [wm, fitWindowToMobile, applyDefaultOpenLayout],
  );

  // Clamp window geometry to the current viewport (desktop centering or mobile fit).
  useLayoutEffect(() => {
    // innerWidth/Height can be 0 on the first layout pass (e.g. before the
    // viewport is sized); falling back avoids applying mobile geometry at x:8.
    const rawVw = typeof window !== 'undefined' ? window.innerWidth : viewport.width;
    const rawVh = typeof window !== 'undefined' ? window.innerHeight : viewport.height;
    // Skip until the browser reports a real viewport; falling back to the SSR
    // size (390px) would apply mobile geometry (x: 8) on wide screens.
    if (rawVw <= 0 || rawVh <= 0) return;

    const vw = rawVw;
    const vh = rawVh;
    const mobile = isMobileViewport(vw);

    function applyLayout() {
      if (mobile) {
        const updates: Record<string, Partial<WindowGeometry>> = {};
        defs.forEach((def) => {
          const win = windowsRef.current[def.id];
          if ((win?.open && !win.minimized) || def.defaultOpen) {
            updates[def.id] = mobileWindowGeometry(vw, vh);
          }
        });
        if (Object.keys(updates).length > 0) {
          setGeometries(updates);
        }
        return;
      }

      // Reposition closed windows; open centered windows settle themselves via
      // useWindowCenterLayout from their measured box.
      relayoutToViewport(vw, vh);
    }

    applyLayout();
    // Re-run once after the first paint when innerWidth/Height are reliable.
    const frame = requestAnimationFrame(applyLayout);
    return () => cancelAnimationFrame(frame);
  }, [defs, setGeometries, relayoutToViewport, viewport.width, viewport.height, layoutEpoch]);

  return { openWindow, fitWindowToMobile };
}
