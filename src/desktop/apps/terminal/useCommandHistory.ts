import { useCallback, useState } from 'react';

/**
 * Readline-style ↑/↓ recall for the terminal. `push` appends a submitted
 * command and resets the cursor; the navigate functions return the draft to
 * show, or `null` when there's nowhere to move (the draft stays untouched).
 */
export function useCommandHistory() {
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const push = useCallback((command: string) => {
    setHistory((prev) => [...prev, command]);
    setHistoryIndex(-1);
  }, []);

  const navigateUp = useCallback((): string | null => {
    if (history.length === 0) return null;
    const nextIndex = historyIndex < 0 ? history.length - 1 : Math.max(0, historyIndex - 1);
    setHistoryIndex(nextIndex);
    return history[nextIndex] ?? '';
  }, [history, historyIndex]);

  const navigateDown = useCallback((): string | null => {
    if (historyIndex < 0) return null;
    const nextIndex = historyIndex + 1;
    if (nextIndex >= history.length) {
      setHistoryIndex(-1);
      return '';
    }
    setHistoryIndex(nextIndex);
    return history[nextIndex] ?? '';
  }, [history, historyIndex]);

  return { push, navigateUp, navigateDown };
}
