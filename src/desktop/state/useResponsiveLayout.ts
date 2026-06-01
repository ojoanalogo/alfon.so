import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { WindowManager } from './useWindowManager';
import type { WindowDef, WindowGeometry } from '../types';
import { isMobileViewport, mobileWindowGeometry } from '../lib/viewport';

export function useResponsiveLayout(
  wm: WindowManager,
  defs: WindowDef[],
  viewport: { width: number; height: number },
): { openWindow: (id: string) => void; fitWindowToMobile: (id: string) => void } {
  const { setGeometry, setGeometries, relayoutToViewport } = wm;
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
      wm.open(id);
      if (isMobileViewport()) {
        fitWindowToMobile(id);
      }
    },
    [wm, fitWindowToMobile],
  );

  // Clamp window geometry to the current viewport (desktop centering or mobile fit).
  useLayoutEffect(() => {
    // innerWidth/Height can be 0 on the first layout pass (e.g. before the
    // viewport is sized); falling back avoids applying mobile geometry at x:8.
    const rawVw = typeof window !== 'undefined' ? window.innerWidth : viewport.width;
    const rawVh = typeof window !== 'undefined' ? window.innerHeight : viewport.height;
    const vw = rawVw > 0 ? rawVw : viewport.width;
    const vh = rawVh > 0 ? rawVh : viewport.height;
    const mobile = isMobileViewport(vw);

    let deferredVerticalCenter = false;

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

      const clearingSizedHeight = defs.some(
        (def) => def.defaultHeight == null && windowsRef.current[def.id]?.height != null,
      );
      if (clearingSizedHeight) deferredVerticalCenter = true;

      relayoutToViewport(vw, vh, !clearingSizedHeight);
    }

    applyLayout();
    requestAnimationFrame(applyLayout);
    if (!mobile && defs.some((def) => def.center)) {
      requestAnimationFrame(() => requestAnimationFrame(applyLayout));
    }

    // rAF passes above still see pre-commit window state in windowsRef; after
    // height:null lands, run layout again so centered windows get their y.
    if (deferredVerticalCenter) {
      setLayoutEpoch((epoch) => epoch + 1);
    }
  }, [defs, setGeometries, relayoutToViewport, viewport.width, viewport.height, layoutEpoch]);

  return { openWindow, fitWindowToMobile };
}
