import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { WindowManager } from './useWindowManager';
import type { WindowDef, WindowGeometry } from '../types';
import {
  isMobileViewport,
  mobileWindowGeometry,
  resolveWindowGeometry,
} from '../lib/viewport';

export function useResponsiveLayout(
  wm: WindowManager,
  defs: WindowDef[],
  viewport: { width: number; height: number },
): { openWindow: (id: string) => void; fitWindowToMobile: (id: string) => void } {
  const { setGeometry } = wm;
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
    return () => {
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
    const vw = typeof window !== 'undefined' ? window.innerWidth : viewport.width;
    const vh = typeof window !== 'undefined' ? window.innerHeight : viewport.height;
    const mobile = isMobileViewport(vw);

    function applyLayout() {
      defs.forEach((def) => {
        const win = windowsRef.current[def.id];
        if (mobile) {
          if ((win?.open && !win.minimized) || def.defaultOpen) {
            setGeometry(def.id, mobileWindowGeometry(vw, vh));
          }
          return;
        }

        // Dropping a fixed inline height: DOM measure still reflects the old
        // sized box this frame — defer vertical centering to the next pass.
        const clearingSizedHeight = def.defaultHeight == null && win?.height != null;

        let measuredHeight: number | undefined;
        if (def.center) {
          const el = document.querySelector<HTMLElement>(`[data-window-id="${def.id}"]`);
          const rawHeight = el?.getBoundingClientRect().height;
          if (!clearingSizedHeight && rawHeight) {
            measuredHeight = rawHeight;
          }
        }

        const geo = resolveWindowGeometry(def, vw, vh, measuredHeight);
        // Non-center windows keep their initial y; only width/x are reclamped.
        const patch: Partial<WindowGeometry> = { width: geo.width, x: geo.x };
        if (def.center && !clearingSizedHeight) patch.y = geo.y;
        if (clearingSizedHeight) patch.height = null;
        setGeometry(def.id, patch);
      });
    }

    applyLayout();
    requestAnimationFrame(applyLayout);
    if (!mobile && defs.some((def) => def.center)) {
      requestAnimationFrame(() => requestAnimationFrame(applyLayout));
    }
  }, [defs, setGeometry, viewport.width, viewport.height, layoutEpoch]);

  return { openWindow, fitWindowToMobile };
}
