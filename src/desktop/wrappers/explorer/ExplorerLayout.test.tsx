import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExplorerLayout from './ExplorerLayout';
import { ExplorerViewProvider } from './ExplorerViewContext';
import type { ListItem } from './types';
import type { ExplorerViewMode } from './types';

function renderLayout(
  items: ListItem[],
  onActivate: (id: string) => void,
  mode: ExplorerViewMode = 'grid',
) {
  return render(
    <ExplorerViewProvider defaultMode={mode}>
      <ExplorerLayout items={items} onActivate={onActivate} />
    </ExplorerViewProvider>,
  );
}

describe('ExplorerLayout', () => {
  it('renders the grid layout when mode is grid', () => {
    const items: ListItem[] = [
      { id: 'a', label: 'Alpha' },
      { id: 'b', label: 'Beta' },
    ];
    const { container } = renderLayout(items, vi.fn(), 'grid');

    // Grid layout uses the auto-fill grid container (role="list" on a div).
    expect(container.querySelector('div[role="list"].grid')).toBeTruthy();
    // No list header ("Nombre" column) is rendered in grid mode.
    expect(screen.queryByText('Nombre')).toBeNull();
    expect(screen.getByText('Alpha')).toBeTruthy();
    expect(screen.getByText('Beta')).toBeTruthy();
  });

  it('renders the list layout with header when mode is list', () => {
    const items: ListItem[] = [
      { id: 'a', label: 'Alpha', kind: 'PDF' },
      { id: 'b', label: 'Beta', kind: 'Carpeta' },
    ];
    const { container } = renderLayout(items, vi.fn(), 'list');

    // FolderList renders an <ul class="folder-list"> with the showHeader columns.
    expect(container.querySelector('ul.folder-list')).toBeTruthy();
    expect(screen.getByText('Nombre')).toBeTruthy();
    expect(screen.getByText('Tipo')).toBeTruthy();
    expect(screen.getByText('Tamaño')).toBeTruthy();
    // No grid layout container (the auto-fill grid div) in list mode.
    expect(container.querySelector('div[role="list"].grid')).toBeNull();
  });

  it('always wraps content in the explorer-layout container', () => {
    const { container } = renderLayout([{ id: 'a', label: 'Alpha' }], vi.fn(), 'grid');
    expect(container.querySelector('.explorer-layout')).toBeTruthy();
  });

  it('throws if rendered outside an ExplorerViewProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(<ExplorerLayout items={[{ id: 'a', label: 'Alpha' }]} onActivate={vi.fn()} />),
    ).toThrow(/useExplorerView must be used within ExplorerViewProvider/);
    spy.mockRestore();
  });

  describe('item ordering (default sortBy=name preserves insertion order)', () => {
    it('preserves the given order in grid mode regardless of label/kind', () => {
      // Deliberately not alphabetical to prove no re-sorting happens.
      const items: ListItem[] = [
        { id: 'z', label: 'Zebra', kind: 'B' },
        { id: 'a', label: 'Apple', kind: 'A' },
        { id: 'm', label: 'Mango', kind: 'C' },
      ];
      const { container } = renderLayout(items, vi.fn(), 'grid');

      const labels = Array.from(container.querySelectorAll('.grid > *')).map((el) =>
        (el.textContent ?? '').trim(),
      );
      expect(labels).toEqual(['Zebra', 'Apple', 'Mango']);
    });

    it('preserves the given order in list mode', () => {
      const items: ListItem[] = [
        { id: 'z', label: 'Zebra' },
        { id: 'a', label: 'Apple' },
        { id: 'm', label: 'Mango' },
      ];
      const { container } = renderLayout(items, vi.fn(), 'list');

      // The header <li> has no .text-primary label span; data rows do.
      const rowLabels = Array.from(
        container.querySelectorAll('ul.folder-list > li span.text-primary'),
      ).map((span) => (span.textContent ?? '').trim());
      expect(rowLabels).toEqual(['Zebra', 'Apple', 'Mango']);
    });
  });

  describe('activation', () => {
    it('calls onActivate with the item id when an enabled grid item is clicked', () => {
      const onActivate = vi.fn();
      const items: ListItem[] = [
        { id: 'a', label: 'Alpha' },
        { id: 'b', label: 'Beta' },
      ];
      renderLayout(items, onActivate, 'grid');

      fireEvent.click(screen.getByText('Beta'));
      expect(onActivate).toHaveBeenCalledTimes(1);
      expect(onActivate).toHaveBeenCalledWith('b');
    });

    it('does NOT call onActivate for a disabled grid item', () => {
      const onActivate = vi.fn();
      const items: ListItem[] = [
        { id: 'a', label: 'Alpha', disabled: true },
        { id: 'b', label: 'Beta' },
      ];
      renderLayout(items, onActivate, 'grid');

      // Disabled grid cells render as a non-button <div>, so there is no
      // clickable element. Click the rendered element regardless and assert
      // no activation fires.
      const alphaEl = screen.getByText('Alpha').closest('div');
      expect(alphaEl).toBeTruthy();
      fireEvent.click(alphaEl as Element);
      expect(onActivate).not.toHaveBeenCalled();
    });

    it('calls onActivate with the item id when an enabled list row is clicked', () => {
      const onActivate = vi.fn();
      const items: ListItem[] = [
        { id: 'a', label: 'Alpha', kind: 'PDF' },
        { id: 'b', label: 'Beta', kind: 'PDF' },
      ];
      renderLayout(items, onActivate, 'list');

      fireEvent.click(screen.getByText('Alpha'));
      expect(onActivate).toHaveBeenCalledTimes(1);
      expect(onActivate).toHaveBeenCalledWith('a');
    });

    it('does NOT call onActivate for a disabled list row', () => {
      const onActivate = vi.fn();
      const items: ListItem[] = [
        { id: 'a', label: 'Alpha', kind: 'PDF', disabled: true },
        { id: 'b', label: 'Beta', kind: 'PDF' },
      ];
      const { container } = renderLayout(items, onActivate, 'list');

      // Disabled list rows render as a div with the disabled modifier class.
      const disabledRow = container.querySelector('.folder-list__row--disabled');
      expect(disabledRow).toBeTruthy();
      fireEvent.click(disabledRow as Element);
      expect(onActivate).not.toHaveBeenCalled();
    });

    it('activates only the matched enabled item when a disabled item is also present', () => {
      // The find()-based guard must pick the clicked enabled item, not the
      // disabled sibling. (The unmatched-id branch of handleActivate is
      // unreachable via clicks — every rendered item has a real id.)
      const onActivate = vi.fn();
      const items: ListItem[] = [
        { id: 'a', label: 'Alpha', disabled: true },
        { id: 'b', label: 'Beta' },
      ];
      renderLayout(items, onActivate, 'grid');

      fireEvent.click(screen.getByText('Beta'));
      expect(onActivate).toHaveBeenCalledWith('b');
      expect(onActivate).toHaveBeenCalledTimes(1);
    });
  });
});
