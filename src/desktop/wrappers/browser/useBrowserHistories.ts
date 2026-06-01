import { useCallback, useMemo, useState } from 'react';
import { normalizeBrowserUrl } from '../../browserUtils';

export interface BrowserAppState {
  url: string | null;
  history: string[];
  /** Index into `history`; -1 when the app hasn't loaded anything yet. */
  index: number;
  /** Bumps on reload so the iframe gets a new `key`. */
  reloadKey: number;
}

const EMPTY_STATE: BrowserAppState = { url: null, history: [], index: -1, reloadKey: 0 };

export interface BrowserHistories {
  /** Read the current state for one browser app instance. */
  get: (appId: string) => BrowserAppState;
  navigate: (appId: string, rawUrl: string) => string | null;
  reload: (appId: string) => void;
  back: (appId: string) => void;
  forward: (appId: string) => void;
  canBack: (appId: string) => boolean;
  canForward: (appId: string) => boolean;
  /** Seed the initial URL on first open (only if the app is empty). */
  hydrateInitial: (appId: string, initialUrl: string | null) => void;
}

/**
 * One source of truth for every browser-kind app's URL + history + reload state.
 * Each `appId` has its own back/forward stack, so a "Twitter" app and a generic
 * "browser" app don't share navigation state.
 */
export function useBrowserHistories(): BrowserHistories {
  const [states, setStates] = useState<Record<string, BrowserAppState>>({});

  const get = useCallback(
    (appId: string): BrowserAppState => states[appId] ?? EMPTY_STATE,
    [states],
  );

  const navigate = useCallback((appId: string, rawUrl: string): string | null => {
    const normalized = normalizeBrowserUrl(rawUrl);
    if (!normalized) return null;
    setStates((prev) => {
      const current = prev[appId] ?? EMPTY_STATE;
      // Truncate forward history when navigating from a back-stack entry.
      const trimmed = current.history.slice(0, current.index + 1);
      const nextHistory =
        trimmed[trimmed.length - 1] === normalized ? trimmed : [...trimmed, normalized];
      return {
        ...prev,
        [appId]: {
          url: normalized,
          history: nextHistory,
          index: nextHistory.length - 1,
          reloadKey: current.reloadKey,
        },
      };
    });
    return normalized;
  }, []);

  const reload = useCallback((appId: string) => {
    setStates((prev) => {
      const current = prev[appId];
      if (!current) return prev;
      return { ...prev, [appId]: { ...current, reloadKey: current.reloadKey + 1 } };
    });
  }, []);

  const back = useCallback((appId: string) => {
    setStates((prev) => {
      const current = prev[appId];
      if (!current || current.index <= 0) return prev;
      const nextIndex = current.index - 1;
      return {
        ...prev,
        [appId]: { ...current, index: nextIndex, url: current.history[nextIndex] ?? null },
      };
    });
  }, []);

  const forward = useCallback((appId: string) => {
    setStates((prev) => {
      const current = prev[appId];
      if (!current || current.index >= current.history.length - 1) return prev;
      const nextIndex = current.index + 1;
      return {
        ...prev,
        [appId]: { ...current, index: nextIndex, url: current.history[nextIndex] ?? null },
      };
    });
  }, []);

  const canBack = useCallback((appId: string) => (states[appId]?.index ?? -1) > 0, [states]);
  const canForward = useCallback(
    (appId: string) => {
      const s = states[appId];
      return !!s && s.index < s.history.length - 1;
    },
    [states],
  );

  const hydrateInitial = useCallback((appId: string, initialUrl: string | null) => {
    if (!initialUrl) return;
    const normalized = normalizeBrowserUrl(initialUrl);
    if (!normalized) return;
    setStates((prev) => {
      if (prev[appId]) return prev;
      return {
        ...prev,
        [appId]: { url: normalized, history: [normalized], index: 0, reloadKey: 0 },
      };
    });
  }, []);

  return useMemo(
    () => ({ get, navigate, reload, back, forward, canBack, canForward, hydrateInitial }),
    [get, navigate, reload, back, forward, canBack, canForward, hydrateInitial],
  );
}
