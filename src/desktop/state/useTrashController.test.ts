import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTrashController } from './useTrashController';
import type { DesktopIconsState } from './useDesktopIcons';

/**
 * Build a minimal DesktopIconsState. The controller only reads `trashedIcons`,
 * `restoreIcons`, `restoreAll`, and `emptyTrash`; the rest are stubbed.
 */
function makeIconsState(overrides: Partial<DesktopIconsState> = {}): DesktopIconsState {
  return {
    positions: {},
    selected: new Set<string>(),
    deletedCount: 0,
    visibleIcons: [],
    trashedIcons: [],
    trashedCount: 0,
    isSelected: vi.fn(() => false),
    selectOnly: vi.fn(),
    toggleSelection: vi.fn(),
    setSelection: vi.fn(),
    clearSelection: vi.fn(),
    moveIcons: vi.fn(),
    deleteIcons: vi.fn(),
    restoreIcons: vi.fn(),
    emptyTrash: vi.fn(),
    restoreAll: vi.fn(),
    ...overrides,
  } as DesktopIconsState;
}

function makeTrashedIcon(id: string, label: string, iconSrc: string) {
  // The controller only touches id/label/iconSrc; cast through unknown to satisfy DesktopIcon.
  return { id, label, iconSrc } as unknown as DesktopIconsState['trashedIcons'][number];
}

describe('useTrashController', () => {
  describe('items derivation', () => {
    it('maps trashedIcons to { id, label, iconSrc } items', () => {
      const icons = makeIconsState({
        trashedIcons: [
          makeTrashedIcon('a', 'Alpha', '/a.png'),
          makeTrashedIcon('b', 'Beta', '/b.png'),
        ],
      });
      const { result } = renderHook(() => useTrashController(icons, vi.fn()));

      expect(result.current.items).toEqual([
        { id: 'a', label: 'Alpha', iconSrc: '/a.png' },
        { id: 'b', label: 'Beta', iconSrc: '/b.png' },
      ]);
    });

    it('produces an empty items list when no trashed icons', () => {
      const icons = makeIconsState({ trashedIcons: [] });
      const { result } = renderHook(() => useTrashController(icons, vi.fn()));
      expect(result.current.items).toEqual([]);
    });

    it('strips extra fields from the source icons (only id/label/iconSrc survive)', () => {
      const fat = {
        id: 'c',
        label: 'Gamma',
        iconSrc: '/c.png',
        windowId: 'win-c',
        deleted: true,
      } as unknown as DesktopIconsState['trashedIcons'][number];
      const icons = makeIconsState({ trashedIcons: [fat] });
      const { result } = renderHook(() => useTrashController(icons, vi.fn()));

      expect(result.current.items).toHaveLength(1);
      expect(Object.keys(result.current.items[0]).sort()).toEqual([
        'iconSrc',
        'id',
        'label',
      ]);
    });
  });

  describe('callbacks', () => {
    it('onOpenFile delegates to the provided openWindow', () => {
      const openWindow = vi.fn();
      const icons = makeIconsState();
      const { result } = renderHook(() => useTrashController(icons, openWindow));

      expect(result.current.onOpenFile).toBe(openWindow);
      result.current.onOpenFile('win-1');
      expect(openWindow).toHaveBeenCalledWith('win-1');
    });

    it('onRestore calls icons.restoreIcons with a single-id array', () => {
      const restoreIcons = vi.fn();
      const icons = makeIconsState({ restoreIcons });
      const { result } = renderHook(() => useTrashController(icons, vi.fn()));

      result.current.onRestore('x');
      expect(restoreIcons).toHaveBeenCalledTimes(1);
      expect(restoreIcons).toHaveBeenCalledWith(['x']);
    });

    it('onRestoreAll forwards to icons.restoreAll', () => {
      const restoreAll = vi.fn();
      const icons = makeIconsState({ restoreAll });
      const { result } = renderHook(() => useTrashController(icons, vi.fn()));

      expect(result.current.onRestoreAll).toBe(restoreAll);
      result.current.onRestoreAll();
      expect(restoreAll).toHaveBeenCalledTimes(1);
    });

    it('onEmpty forwards to icons.emptyTrash', () => {
      const emptyTrash = vi.fn();
      const icons = makeIconsState({ emptyTrash });
      const { result } = renderHook(() => useTrashController(icons, vi.fn()));

      expect(result.current.onEmpty).toBe(emptyTrash);
      result.current.onEmpty();
      expect(emptyTrash).toHaveBeenCalledTimes(1);
    });
  });

  describe('memoization', () => {
    it('returns a stable reference when icons and openWindow are unchanged', () => {
      const icons = makeIconsState();
      const openWindow = vi.fn();
      const { result, rerender } = renderHook(
        ({ i, o }) => useTrashController(i, o),
        { initialProps: { i: icons, o: openWindow } },
      );
      const first = result.current;
      rerender({ i: icons, o: openWindow });
      expect(result.current).toBe(first);
    });

    it('recomputes when the icons state object changes', () => {
      const openWindow = vi.fn();
      const iconsA = makeIconsState({
        trashedIcons: [makeTrashedIcon('a', 'A', '/a.png')],
      });
      const iconsB = makeIconsState({
        trashedIcons: [makeTrashedIcon('b', 'B', '/b.png')],
      });
      const { result, rerender } = renderHook(
        ({ i }) => useTrashController(i, openWindow),
        { initialProps: { i: iconsA } },
      );
      const first = result.current;
      rerender({ i: iconsB });

      expect(result.current).not.toBe(first);
      expect(result.current.items).toEqual([
        { id: 'b', label: 'B', iconSrc: '/b.png' },
      ]);
    });

    it('recomputes when openWindow changes', () => {
      const icons = makeIconsState();
      const { result, rerender } = renderHook(
        ({ o }) => useTrashController(icons, o),
        { initialProps: { o: vi.fn() } },
      );
      const first = result.current;
      const next = vi.fn();
      rerender({ o: next });

      expect(result.current).not.toBe(first);
      expect(result.current.onOpenFile).toBe(next);
    });
  });
});
