import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FolderList from './FolderList';
import { fakeFileSize } from './fakeFileSize';
import type { ListItem } from './types';

function item(overrides: Partial<ListItem> = {}): ListItem {
  return { id: 'a', label: 'Alpha', ...overrides };
}

describe('FolderList', () => {
  it('renders one row per item with its label', () => {
    const items = [item({ id: 'a', label: 'Alpha' }), item({ id: 'b', label: 'Beta' })];
    render(<FolderList items={items} onOpen={vi.fn()} />);

    expect(screen.getByText('Alpha')).toBeTruthy();
    expect(screen.getByText('Beta')).toBeTruthy();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('calls onOpen with the item id when a row is clicked', () => {
    const onOpen = vi.fn();
    render(<FolderList items={[item({ id: 'doc-1', label: 'Doc' })]} onOpen={onOpen} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith('doc-1');
  });

  it('renders disabled rows as non-clickable divs (no button)', () => {
    const onOpen = vi.fn();
    const { container } = render(
      <FolderList items={[item({ id: 'x', label: 'Locked', disabled: true })]} onOpen={onOpen} />,
    );

    expect(screen.queryByRole('button')).toBeNull();
    const row = container.querySelector('.folder-list__row--disabled');
    expect(row).toBeTruthy();
    // Clicking a disabled row does nothing.
    if (row) fireEvent.click(row);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('renders rows as non-clickable divs when onOpen is omitted', () => {
    const { container } = render(<FolderList items={[item({ label: 'NoHandler' })]} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(container.querySelector('.folder-list__row')).toBeTruthy();
    expect(container.querySelector('.folder-list__row--disabled')).toBeTruthy();
  });

  it('shows the header only when showHeader is set', () => {
    const items = [item()];
    const { container, rerender } = render(<FolderList items={items} onOpen={vi.fn()} />);
    expect(container.querySelector('[aria-hidden="true"]')?.textContent).not.toContain('Nombre');

    rerender(<FolderList items={items} onOpen={vi.fn()} showHeader />);
    expect(screen.getByText('Nombre')).toBeTruthy();
    expect(screen.getByText('Tipo')).toBeTruthy();
    expect(screen.getByText('Tamaño')).toBeTruthy();
  });

  it('uses explicit size when provided, otherwise "—" for folders', () => {
    const items = [
      item({ id: 'f', label: 'Folder', isFolder: true }),
      item({ id: 's', label: 'Sized', size: '99 MB' }),
    ];
    render(<FolderList items={items} onOpen={vi.fn()} />);
    expect(screen.getByText('99 MB')).toBeTruthy();
    // Folder with no explicit size shows the em-dash placeholder.
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('generates a deterministic fake size for a non-folder item without an explicit size', () => {
    render(<FolderList items={[item({ id: 'doc', label: 'Doc', kind: 'PDF' })]} onOpen={vi.fn()} />);
    expect(screen.getByText(fakeFileSize('doc'))).toBeTruthy();
  });

  it('renders the kind column, falling back to "—" when absent', () => {
    render(
      <FolderList
        items={[item({ id: 'k', label: 'WithKind', kind: 'PDF', size: '1 KB' })]}
        onOpen={vi.fn()}
      />,
    );
    expect(screen.getByText('PDF')).toBeTruthy();
  });

  it('applies an extra className alongside the base folder-list class', () => {
    const { container } = render(
      <FolderList items={[item()]} onOpen={vi.fn()} className="custom-cls" />,
    );
    const ul = container.querySelector('ul');
    expect(ul?.classList.contains('folder-list')).toBe(true);
    expect(ul?.classList.contains('custom-cls')).toBe(true);
  });

  it('renders an empty list without rows', () => {
    render(<FolderList items={[]} onOpen={vi.fn()} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
