import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { BROWSER_APP_ID, postWindowId } from '../lib/appIds';
import type { AppContext, AppDefinition, NoteViewMode, TrashController } from '@desktop/wrappers';
import type { BlogPostSummary, WindowGeometry } from '../types';
import type { DesktopIconUrls } from '@desktop/lib/desktopIcons';
import type { BrowserHistories } from '../wrappers/browser/useBrowserHistories';

export interface PendingNoteOpen {
  noteId: string;
  mode: NoteViewMode;
}

export interface NoteOpenBridge {
  consumePendingNoteOpen: () => PendingNoteOpen | null;
  subscribePendingNoteOpen: (listener: () => void) => () => void;
}

export function createNoteOpenBridge(): NoteOpenBridge & {
  onOpenNote: (noteId: string, mode?: NoteViewMode) => void;
} {
  let pending: PendingNoteOpen | null = null;
  const listeners = new Set<() => void>();

  function onOpenNote(noteId: string, mode: NoteViewMode = 'edit'): void {
    pending = { noteId, mode };
    for (const listener of listeners) listener();
  }

  function consumePendingNoteOpen(): PendingNoteOpen | null {
    const current = pending;
    pending = null;
    return current;
  }

  function subscribePendingNoteOpen(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return { onOpenNote, consumePendingNoteOpen, subscribePendingNoteOpen };
}

const NoteOpenBridgeContext = createContext<NoteOpenBridge | null>(null);

export function NoteOpenBridgeProvider({
  bridge,
  children,
}: {
  bridge: NoteOpenBridge;
  children: ReactNode;
}) {
  return createElement(NoteOpenBridgeContext.Provider, { value: bridge }, children);
}

export function useNoteOpenBridge(): NoteOpenBridge {
  const bridge = useContext(NoteOpenBridgeContext);
  if (!bridge) {
    throw new Error('useNoteOpenBridge must be used within DesktopShell or NoteOpenBridgeProvider');
  }
  return bridge;
}

interface UseAppContextParams {
  apps: AppDefinition[];
  posts: BlogPostSummary[];
  openWindow: (id: string) => void;
  browsers: BrowserHistories;
  trash: TrashController;
  desktopIconUrls: DesktopIconUrls;
  correctLayout: (id: string, geometry: Partial<WindowGeometry>) => void;
}

export interface DesktopAppContextValue {
  appContext: AppContext;
  noteOpenBridge: NoteOpenBridge;
}

function useStableNoteOpenBridge() {
  const bridgeRef = useRef<ReturnType<typeof createNoteOpenBridge> | null>(null);
  if (!bridgeRef.current) {
    bridgeRef.current = createNoteOpenBridge();
  }
  return bridgeRef.current;
}

export function useDesktopAppContextValue({
  apps,
  posts,
  openWindow,
  browsers,
  trash,
  desktopIconUrls,
  correctLayout,
}: UseAppContextParams): DesktopAppContextValue {
  const noteOpenBridge = useStableNoteOpenBridge();

  const findApp = useCallback(
    (id: string) => (id ? apps.find((app) => app.id === id) : undefined),
    [apps],
  );

  const handleOpenLink = useCallback(
    (url: string) => {
      const normalized = browsers.navigate(BROWSER_APP_ID, url);
      if (!normalized) return;
      correctLayout(BROWSER_APP_ID, { height: 520 });
      openWindow(BROWSER_APP_ID);
    },
    [browsers, openWindow, correctLayout],
  );

  const appContext = useMemo<AppContext>(
    () => ({
      posts,
      onOpenPost: (slug: string) => openWindow(postWindowId(slug)),
      onOpenApp: openWindow,
      onOpenLink: handleOpenLink,
      onOpenNote: noteOpenBridge.onOpenNote,
      browsers,
      trash,
      iconUrls: desktopIconUrls,
      findApp,
    }),
    [posts, openWindow, handleOpenLink, noteOpenBridge, browsers, trash, desktopIconUrls, findApp],
  );

  return useMemo(
    () => ({
      appContext,
      noteOpenBridge,
    }),
    [appContext, noteOpenBridge],
  );
}
