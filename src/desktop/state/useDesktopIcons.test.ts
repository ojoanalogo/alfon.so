import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { DesktopIcon } from '@/config';
import { EDGE_MARGIN, TASKBAR_HEIGHT } from '../lib/layoutConstants';
import { useDesktopIcons } from './useDesktopIcons';

function makeIcon(id: string, overrides: Partial<DesktopIcon> = {}): DesktopIcon {
  return {
    id,
    label: id,
    windowId: `${id}-win`,
    iconSrc: `/${id}.png`,
    ...overrides,
  };
}

function makeIcons(...ids: string[]): DesktopIcon[] {
  return ids.map((id) => makeIcon(id));
}

// jsdom defaults: innerWidth = 1024, innerHeight = 768.
// Desktop (non-mobile) footprint: width 80, height 72.
// maxX = 1024 - 80 - 8 = 936 ; maxY = 768 - 40 - 72 - 8 = 648.
const DESKTOP_MAX_X = window.innerWidth - 80 - EDGE_MARGIN;
const DESKTOP_MAX_Y = window.innerHeight - TASKBAR_HEIGHT - 72 - EDGE_MARGIN;

describe('useDesktopIcons - default positions', () => {
  it('lays icons out in a single column with 84px row pitch starting at (16,16)', () => {
    const icons = makeIcons('a', 'b', 'c');
    const { result } = renderHook(() => useDesktopIcons(icons));

    expect(result.current.positions.a).toEqual({ x: 16, y: 16 });
    expect(result.current.positions.b).toEqual({ x: 16, y: 16 + 84 });
    expect(result.current.positions.c).toEqual({ x: 16, y: 16 + 168 });
  });

  it('wraps to a new column after MAX_ROWS_DESKTOP (6) icons', () => {
    const icons = makeIcons('i0', 'i1', 'i2', 'i3', 'i4', 'i5', 'i6', 'i7');
    const { result } = renderHook(() => useDesktopIcons(icons));

    // index 5 is the last in column 0
    expect(result.current.positions.i5).toEqual({ x: 16, y: 16 + 5 * 84 });
    // index 6 wraps to column 1, row 0
    expect(result.current.positions.i6).toEqual({ x: 16 + 96, y: 16 });
    expect(result.current.positions.i7).toEqual({ x: 16 + 96, y: 16 + 84 });
  });

  it('returns an empty position map for no icons', () => {
    const { result } = renderHook(() => useDesktopIcons([]));
    expect(result.current.positions).toEqual({});
    expect(result.current.visibleIcons).toEqual([]);
  });

  it('exposes all icons as visible and none trashed/deleted initially', () => {
    const icons = makeIcons('a', 'b');
    const { result } = renderHook(() => useDesktopIcons(icons));

    expect(result.current.visibleIcons.map((i) => i.id)).toEqual(['a', 'b']);
    expect(result.current.trashedIcons).toEqual([]);
    expect(result.current.trashedCount).toBe(0);
    expect(result.current.deletedCount).toBe(0);
  });
});

describe('useDesktopIcons - selection', () => {
  it('selectOnly replaces the selection with a single id', () => {
    const { result } = renderHook(() => useDesktopIcons(makeIcons('a', 'b')));

    act(() => result.current.selectOnly('a'));
    expect(result.current.isSelected('a')).toBe(true);
    expect(result.current.isSelected('b')).toBe(false);
    expect([...result.current.selected]).toEqual(['a']);

    act(() => result.current.selectOnly('b'));
    expect(result.current.isSelected('a')).toBe(false);
    expect(result.current.isSelected('b')).toBe(true);
  });

  it('toggleSelection adds then removes an id', () => {
    const { result } = renderHook(() => useDesktopIcons(makeIcons('a', 'b')));

    act(() => result.current.toggleSelection('a'));
    expect(result.current.isSelected('a')).toBe(true);

    act(() => result.current.toggleSelection('b'));
    expect([...result.current.selected].sort()).toEqual(['a', 'b']);

    act(() => result.current.toggleSelection('a'));
    expect(result.current.isSelected('a')).toBe(false);
    expect(result.current.isSelected('b')).toBe(true);
  });

  it('setSelection replaces the selection with the supplied ids', () => {
    const { result } = renderHook(() => useDesktopIcons(makeIcons('a', 'b', 'c')));

    act(() => result.current.setSelection(['a', 'c']));
    expect([...result.current.selected].sort()).toEqual(['a', 'c']);

    act(() => result.current.setSelection(['b']));
    expect([...result.current.selected]).toEqual(['b']);
  });

  it('clearSelection empties the selection', () => {
    const { result } = renderHook(() => useDesktopIcons(makeIcons('a', 'b')));

    act(() => result.current.setSelection(['a', 'b']));
    expect(result.current.selected.size).toBe(2);

    act(() => result.current.clearSelection());
    expect(result.current.selected.size).toBe(0);
  });

  it('clearSelection keeps the same Set reference when already empty', () => {
    const { result } = renderHook(() => useDesktopIcons(makeIcons('a')));

    const before = result.current.selected;
    act(() => result.current.clearSelection());
    expect(result.current.selected).toBe(before);
  });

  it('selectOnly keeps the same Set reference when already the sole selection', () => {
    const { result } = renderHook(() => useDesktopIcons(makeIcons('a', 'b')));

    act(() => result.current.selectOnly('a'));
    const before = result.current.selected;
    act(() => result.current.selectOnly('a'));
    expect(result.current.selected).toBe(before);
  });

  it('setSelection keeps the same Set reference when the ids are unchanged', () => {
    const { result } = renderHook(() => useDesktopIcons(makeIcons('a', 'b', 'c')));

    act(() => result.current.setSelection(['a', 'c']));
    const before = result.current.selected;
    act(() => result.current.setSelection(['a', 'c']));
    expect(result.current.selected).toBe(before);
  });
});

describe('useDesktopIcons - moveIcons (clamped)', () => {
  it('applies dx/dy from the supplied origins', () => {
    const { result } = renderHook(() => useDesktopIcons(makeIcons('a', 'b')));

    act(() => {
      result.current.moveIcons({ a: { x: 100, y: 100 } }, 20, 30);
    });
    expect(result.current.positions.a).toEqual({ x: 120, y: 130 });
    // untouched icon keeps its default position
    expect(result.current.positions.b).toEqual({ x: 16, y: 16 + 84 });
  });

  it('clamps to the lower EDGE_MARGIN bound', () => {
    const { result } = renderHook(() => useDesktopIcons(makeIcons('a')));

    act(() => {
      result.current.moveIcons({ a: { x: 0, y: 0 } }, -1000, -1000);
    });
    expect(result.current.positions.a).toEqual({ x: EDGE_MARGIN, y: EDGE_MARGIN });
  });

  it('clamps to the viewport upper bounds (maxX/maxY)', () => {
    const { result } = renderHook(() => useDesktopIcons(makeIcons('a')));

    act(() => {
      result.current.moveIcons({ a: { x: 0, y: 0 } }, 99999, 99999);
    });
    expect(result.current.positions.a).toEqual({ x: DESKTOP_MAX_X, y: DESKTOP_MAX_Y });
  });

  it('moves multiple icons in one call', () => {
    const { result } = renderHook(() => useDesktopIcons(makeIcons('a', 'b')));

    act(() => {
      result.current.moveIcons({ a: { x: 100, y: 100 }, b: { x: 200, y: 200 } }, 10, -10);
    });
    expect(result.current.positions.a).toEqual({ x: 110, y: 90 });
    expect(result.current.positions.b).toEqual({ x: 210, y: 190 });
  });
});

describe('useDesktopIcons - deleteIcons', () => {
  it('moves icons to the trash, updating visible/trashed/counts', () => {
    const { result } = renderHook(() => useDesktopIcons(makeIcons('a', 'b', 'c')));

    act(() => result.current.deleteIcons(['b']));

    expect(result.current.visibleIcons.map((i) => i.id)).toEqual(['a', 'c']);
    expect(result.current.trashedIcons.map((i) => i.id)).toEqual(['b']);
    expect(result.current.trashedCount).toBe(1);
    expect(result.current.deletedCount).toBe(1);
  });

  it('removes deleted ids from the current selection', () => {
    const { result } = renderHook(() => useDesktopIcons(makeIcons('a', 'b')));

    act(() => result.current.setSelection(['a', 'b']));
    act(() => result.current.deleteIcons(['a']));

    expect(result.current.isSelected('a')).toBe(false);
    expect(result.current.isSelected('b')).toBe(true);
  });

  it('is a no-op for an empty id list', () => {
    const { result } = renderHook(() => useDesktopIcons(makeIcons('a')));

    act(() => result.current.deleteIcons([]));
    expect(result.current.trashedCount).toBe(0);
    expect(result.current.deletedCount).toBe(0);
    expect(result.current.visibleIcons.map((i) => i.id)).toEqual(['a']);
  });
});

describe('useDesktopIcons - restoreIcons', () => {
  it('brings specific icons back from the trash', () => {
    const { result } = renderHook(() => useDesktopIcons(makeIcons('a', 'b', 'c')));

    act(() => result.current.deleteIcons(['a', 'b']));
    expect(result.current.trashedCount).toBe(2);

    act(() => result.current.restoreIcons(['a']));

    expect(result.current.visibleIcons.map((i) => i.id)).toEqual(['a', 'c']);
    expect(result.current.trashedIcons.map((i) => i.id)).toEqual(['b']);
    expect(result.current.trashedCount).toBe(1);
    expect(result.current.deletedCount).toBe(1);
  });

  it('is a no-op when nothing is in the trash', () => {
    const { result } = renderHook(() => useDesktopIcons(makeIcons('a')));

    const before = result.current.trashedIcons;
    act(() => result.current.restoreIcons(['a']));
    expect(result.current.trashedIcons).toBe(before);
    expect(result.current.visibleIcons.map((i) => i.id)).toEqual(['a']);
  });

  it('is a no-op for an empty id list', () => {
    const { result } = renderHook(() => useDesktopIcons(makeIcons('a')));

    act(() => result.current.deleteIcons(['a']));
    act(() => result.current.restoreIcons([]));
    expect(result.current.trashedCount).toBe(1);
  });

  it('keeps a trashed icon position across a resize so restore lands it back', async () => {
    const { result } = renderHook(() => useDesktopIcons(makeIcons('a', 'b')));

    act(() => result.current.moveIcons({ a: { x: 100, y: 100 } }, 50, 60));
    expect(result.current.positions.a).toEqual({ x: 150, y: 160 });

    act(() => result.current.deleteIcons(['a']));
    // A resize fires while 'a' sits in the trash: its position must be retained,
    // not dropped (a relayout over visible-only icons would lose it).
    await act(async () => {
      window.dispatchEvent(new Event('resize'));
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    });
    expect(result.current.positions.a).toEqual({ x: 150, y: 160 });

    act(() => result.current.restoreIcons(['a']));
    expect(result.current.positions.a).toEqual({ x: 150, y: 160 });
  });
});

describe('useDesktopIcons - emptyTrash', () => {
  it('purges trashed icons: they stay gone, trashedCount drops, deletedCount stays', () => {
    const { result } = renderHook(() => useDesktopIcons(makeIcons('a', 'b', 'c')));

    act(() => result.current.deleteIcons(['a', 'b']));
    expect(result.current.trashedCount).toBe(2);
    expect(result.current.deletedCount).toBe(2);

    act(() => result.current.emptyTrash());

    // purged icons are no longer restorable from the trash
    expect(result.current.trashedIcons).toEqual([]);
    expect(result.current.trashedCount).toBe(0);
    // but they still count as deleted (gone until reload)
    expect(result.current.deletedCount).toBe(2);
    expect(result.current.visibleIcons.map((i) => i.id)).toEqual(['c']);
  });

  it('restoreIcons cannot bring back a purged icon', () => {
    const { result } = renderHook(() => useDesktopIcons(makeIcons('a', 'b')));

    act(() => result.current.deleteIcons(['a']));
    act(() => result.current.emptyTrash());
    act(() => result.current.restoreIcons(['a']));

    expect(result.current.visibleIcons.map((i) => i.id)).toEqual(['b']);
    expect(result.current.deletedCount).toBe(1);
  });

  it('is a no-op when the trash is empty', () => {
    const { result } = renderHook(() => useDesktopIcons(makeIcons('a')));

    act(() => result.current.emptyTrash());
    expect(result.current.deletedCount).toBe(0);
    expect(result.current.visibleIcons.map((i) => i.id)).toEqual(['a']);
  });
});

describe('useDesktopIcons - restoreAll', () => {
  it('brings back both trashed and purged icons', () => {
    const { result } = renderHook(() => useDesktopIcons(makeIcons('a', 'b', 'c')));

    act(() => result.current.deleteIcons(['a']));
    act(() => result.current.emptyTrash()); // a is now purged
    act(() => result.current.deleteIcons(['b'])); // b is in the trash

    expect(result.current.deletedCount).toBe(2);
    expect(result.current.trashedCount).toBe(1);

    act(() => result.current.restoreAll());

    expect(result.current.deletedCount).toBe(0);
    expect(result.current.trashedCount).toBe(0);
    expect(result.current.visibleIcons.map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });

  it('keeps Set references stable when nothing is removed', () => {
    const { result } = renderHook(() => useDesktopIcons(makeIcons('a')));

    act(() => result.current.restoreAll());
    expect(result.current.deletedCount).toBe(0);
    expect(result.current.visibleIcons.map((i) => i.id)).toEqual(['a']);
  });
});
