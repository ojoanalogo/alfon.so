import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ExplorerViewMode } from './types';

interface ExplorerViewContextValue {
  mode: ExplorerViewMode;
  setMode: (mode: ExplorerViewMode) => void;
}

const ExplorerViewContext = createContext<ExplorerViewContextValue | null>(null);

export function ExplorerViewProvider({
  defaultMode = 'grid',
  children,
}: {
  defaultMode?: ExplorerViewMode;
  children: ReactNode;
}) {
  const [mode, setMode] = useState<ExplorerViewMode>(defaultMode);
  const value = useMemo(() => ({ mode, setMode }), [mode]);

  return <ExplorerViewContext.Provider value={value}>{children}</ExplorerViewContext.Provider>;
}

export function useExplorerView() {
  const context = useContext(ExplorerViewContext);
  if (!context) {
    throw new Error('useExplorerView must be used within ExplorerViewProvider');
  }
  return context;
}
