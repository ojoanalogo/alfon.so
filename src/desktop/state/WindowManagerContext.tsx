import { createContext, useContext, type ReactNode } from 'react';
import { useWindowManager, type WindowManager } from './useWindowManager';
import type { WindowDef } from '../types';

const WindowManagerContext = createContext<WindowManager | null>(null);

interface WindowManagerProviderProps {
  defs: WindowDef[];
  viewportWidth: number;
  viewportHeight: number;
  children: ReactNode;
}

export function WindowManagerProvider({
  defs,
  viewportWidth,
  viewportHeight,
  children,
}: WindowManagerProviderProps) {
  const manager = useWindowManager(defs, viewportWidth, viewportHeight);
  return <WindowManagerContext.Provider value={manager}>{children}</WindowManagerContext.Provider>;
}

export function useWindowManagerContext(): WindowManager {
  const ctx = useContext(WindowManagerContext);
  if (!ctx) {
    throw new Error('useWindowManagerContext must be used within WindowManagerProvider');
  }
  return ctx;
}
