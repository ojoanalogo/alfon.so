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
  getWindowTransparency,
  setWindowTransparency,
  syncWindowTransparencyFromStorage,
} from '@/lib/windowTransparency';

interface WindowTransparencyContextValue {
  level: number;
  setLevel: (level: number) => void;
}

const WindowTransparencyContext = createContext<WindowTransparencyContextValue | null>(null);

export function WindowTransparencyProvider({ children }: { children: ReactNode }) {
  const [level, setLevelState] = useState(getWindowTransparency);

  useEffect(() => {
    syncWindowTransparencyFromStorage();
    return attachWindowTransparencyListener(() => {
      setLevelState(getWindowTransparency());
    });
  }, []);

  const setLevel = useCallback((next: number) => {
    setWindowTransparency(next);
    setLevelState(getWindowTransparency());
  }, []);

  const value = useMemo(
    () => ({
      level,
      setLevel,
    }),
    [level, setLevel],
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
