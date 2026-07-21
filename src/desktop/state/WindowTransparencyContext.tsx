import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  attachWindowTransparencyListener,
  getWindowTransparencyEnabled,
  setWindowTransparencyEnabled,
  syncWindowTransparencyFromStorage,
} from '@/lib/windowTransparency';

interface WindowTransparencyContextValue {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const WindowTransparencyContext = createContext<WindowTransparencyContextValue | null>(null);

export function WindowTransparencyProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(getWindowTransparencyEnabled);

  useEffect(() => {
    syncWindowTransparencyFromStorage();
    return attachWindowTransparencyListener(() => {
      setEnabledState(getWindowTransparencyEnabled());
    });
  }, []);

  const setEnabled = useCallback((next: boolean) => {
    setWindowTransparencyEnabled(next);
    setEnabledState(getWindowTransparencyEnabled());
  }, []);

  const value = useMemo(
    () => ({
      enabled,
      setEnabled,
    }),
    [enabled, setEnabled],
  );

  return (
    <WindowTransparencyContext.Provider value={value}>
      {children}
    </WindowTransparencyContext.Provider>
  );
}

export function useWindowTransparency(): WindowTransparencyContextValue {
  const context = useContext(WindowTransparencyContext);
  if (!context) {
    throw new Error('useWindowTransparency must be used within WindowTransparencyProvider');
  }
  return context;
}
