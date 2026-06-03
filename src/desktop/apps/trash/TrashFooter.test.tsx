import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { TrashController, TrashItem } from '@desktop/wrappers';
import { WINDOW_ACTION_BTN_DESTRUCTIVE } from '@/styles/tokens';
import TrashFooter from './TrashFooter';

function makeItem(id: string): TrashItem {
  return { id, label: `Item ${id}`, iconSrc: `/icons/${id}.svg` };
}

function makeController(overrides: Partial<TrashController> = {}): TrashController {
  return {
    items: [makeItem('a')],
    onOpenFile: vi.fn(),
    onRestore: vi.fn(),
    onRestoreAll: vi.fn(),
    onEmpty: vi.fn(),
    ...overrides,
  };
}

describe('TrashFooter', () => {
  it('renders nothing when the trash is empty', () => {
    const trash = makeController({ items: [] });
    const { container } = render(<TrashFooter trash={trash} />);
    expect(container.firstChild).toBeNull();
    expect(screen.queryByText('restaurar todo')).toBeNull();
    expect(screen.queryByText('vaciar papelera')).toBeNull();
  });

  it('renders both action buttons when there are trashed items', () => {
    render(<TrashFooter trash={makeController()} />);
    expect(screen.getByText('restaurar todo')).toBeTruthy();
    expect(screen.getByText('vaciar papelera')).toBeTruthy();
  });

  it('calls onRestoreAll when "restaurar todo" is clicked', () => {
    const onRestoreAll = vi.fn();
    render(<TrashFooter trash={makeController({ onRestoreAll })} />);
    fireEvent.click(screen.getByText('restaurar todo'));
    expect(onRestoreAll).toHaveBeenCalledTimes(1);
  });

  it('does not empty the trash directly; clicking "vaciar papelera" opens a confirm modal', () => {
    const onEmpty = vi.fn();
    render(<TrashFooter trash={makeController({ onEmpty })} />);

    // No modal before clicking.
    expect(screen.queryByText('Vaciar papelera')).toBeNull();

    fireEvent.click(screen.getByText('vaciar papelera'));

    // The confirm modal is now shown, but onEmpty has NOT yet fired.
    expect(screen.getByText('Vaciar papelera')).toBeTruthy();
    expect(onEmpty).not.toHaveBeenCalled();
  });

  it('fires onEmpty only after confirming in the modal', () => {
    const onEmpty = vi.fn();
    render(<TrashFooter trash={makeController({ onEmpty })} />);

    fireEvent.click(screen.getByText('vaciar papelera'));
    // The modal's confirm button is labelled "Vaciar".
    fireEvent.click(screen.getByText('Vaciar'));
    expect(onEmpty).toHaveBeenCalledTimes(1);
  });

  it('closes the confirm modal without emptying when cancelled', () => {
    const onEmpty = vi.fn();
    render(<TrashFooter trash={makeController({ onEmpty })} />);

    fireEvent.click(screen.getByText('vaciar papelera'));
    expect(screen.getByText('Vaciar papelera')).toBeTruthy();

    fireEvent.click(screen.getByText('Cancelar'));
    expect(onEmpty).not.toHaveBeenCalled();
    // Modal title is gone after cancelling.
    expect(screen.queryByText('Vaciar papelera')).toBeNull();
  });

  it('pluralises the confirmation copy for multiple items', () => {
    const trash = makeController({ items: [makeItem('a'), makeItem('b'), makeItem('c')] });
    render(<TrashFooter trash={trash} />);
    fireEvent.click(screen.getByText('vaciar papelera'));
    expect(screen.getByText(/Eliminar permanentemente 3 iconos/)).toBeTruthy();
  });

  it('uses the singular noun in the confirmation copy for a single item', () => {
    const trash = makeController({ items: [makeItem('only')] });
    render(<TrashFooter trash={trash} />);
    fireEvent.click(screen.getByText('vaciar papelera'));
    const node = screen.getByText(/Eliminar permanentemente 1 icono/);
    // Singular "icono" (no trailing "s" before the question mark).
    expect(node.textContent).toContain('1 icono?');
    expect(node.textContent).not.toContain('1 iconos');
  });

  it('styles the empty button with the destructive token', () => {
    render(<TrashFooter trash={makeController()} />);
    const emptyBtn = screen.getByText('vaciar papelera');
    expect(emptyBtn.className).toBe(WINDOW_ACTION_BTN_DESTRUCTIVE);
  });
});
