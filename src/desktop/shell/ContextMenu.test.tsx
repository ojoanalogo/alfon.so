import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ContextMenu, { type ContextMenuItem } from './ContextMenu';

function makeItem(overrides: Partial<ContextMenuItem> = {}): ContextMenuItem {
  return {
    label: 'Item',
    onSelect: vi.fn(),
    ...overrides,
  };
}

describe('ContextMenu', () => {
  beforeEach(() => {
    // jsdom returns 0-sized rects, so clamp math is deterministic.
    vi.restoreAllMocks();
  });

  it('renders a menuitem button for each item', () => {
    const items = [
      makeItem({ label: 'Open' }),
      makeItem({ label: 'Rename' }),
      makeItem({ label: 'Delete' }),
    ];
    render(<ContextMenu x={10} y={10} items={items} onClose={vi.fn()} />);

    const buttons = screen.getAllByRole('menuitem');
    expect(buttons).toHaveLength(3);
    expect(buttons.map((b) => b.textContent)).toEqual(['Open', 'Rename', 'Delete']);
  });

  it('exposes the container as a labelled menu', () => {
    render(<ContextMenu x={0} y={0} items={[makeItem()]} onClose={vi.fn()} />);
    const menu = screen.getByRole('menu');
    expect(menu.getAttribute('aria-label')).toBe('Menú contextual');
  });

  it('clicking an item calls its onSelect then onClose', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(
      <ContextMenu x={0} y={0} items={[makeItem({ label: 'Go', onSelect })]} onClose={onClose} />,
    );

    fireEvent.click(screen.getByText('Go'));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('only the clicked item action fires', () => {
    const a = vi.fn();
    const b = vi.fn();
    render(
      <ContextMenu
        x={0}
        y={0}
        items={[makeItem({ label: 'A', onSelect: a }), makeItem({ label: 'B', onSelect: b })]}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText('B'));

    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledTimes(1);
  });

  it('renders disabled items as disabled buttons', () => {
    render(
      <ContextMenu
        x={0}
        y={0}
        items={[makeItem({ label: 'Nope', disabled: true })]}
        onClose={vi.fn()}
      />,
    );
    const button = screen.getByText('Nope') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('clicking a disabled item does not call onSelect or onClose', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(
      <ContextMenu
        x={0}
        y={0}
        items={[makeItem({ label: 'Nope', disabled: true, onSelect })]}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByText('Nope'));

    expect(onSelect).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders a separator before an item when separatorBefore is set and index > 0', () => {
    const { container } = render(
      <ContextMenu
        x={0}
        y={0}
        items={[makeItem({ label: 'First' }), makeItem({ label: 'Second', separatorBefore: true })]}
        onClose={vi.fn()}
      />,
    );
    const separators = container.querySelectorAll('span[aria-hidden="true"]');
    expect(separators).toHaveLength(1);
  });

  it('does not render a separator on the first item even with separatorBefore', () => {
    const { container } = render(
      <ContextMenu
        x={0}
        y={0}
        items={[makeItem({ label: 'First', separatorBefore: true })]}
        onClose={vi.fn()}
      />,
    );
    expect(container.querySelector('span[aria-hidden="true"]')).toBeNull();
  });

  it('Escape closes the menu', () => {
    const onClose = vi.fn();
    render(<ContextMenu x={0} y={0} items={[makeItem()]} onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('a non-Escape key does not close the menu', () => {
    const onClose = vi.fn();
    render(<ContextMenu x={0} y={0} items={[makeItem()]} onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Enter' });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('pointerdown outside the menu closes it', () => {
    const onClose = vi.fn();
    render(<ContextMenu x={0} y={0} items={[makeItem()]} onClose={onClose} />);

    // Dispatch a real pointer event so capture-phase window listener fires
    // against a target that is not inside the menu.
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    outside.dispatchEvent(new Event('pointerdown', { bubbles: true }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('pointerdown inside the menu does not close it', () => {
    const onClose = vi.fn();
    render(<ContextMenu x={0} y={0} items={[makeItem({ label: 'Inside' })]} onClose={onClose} />);

    const button = screen.getByText('Inside');
    button.dispatchEvent(new Event('pointerdown', { bubbles: true }));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('scroll closes the menu', () => {
    const onClose = vi.fn();
    render(<ContextMenu x={0} y={0} items={[makeItem()]} onClose={onClose} />);

    fireEvent.scroll(window);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('resize closes the menu', () => {
    const onClose = vi.fn();
    render(<ContextMenu x={0} y={0} items={[makeItem()]} onClose={onClose} />);

    window.dispatchEvent(new Event('resize'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('blur closes the menu', () => {
    const onClose = vi.fn();
    render(<ContextMenu x={0} y={0} items={[makeItem()]} onClose={onClose} />);

    window.dispatchEvent(new Event('blur'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('removes its window listeners on unmount', () => {
    const onClose = vi.fn();
    const { unmount } = render(<ContextMenu x={0} y={0} items={[makeItem()]} onClose={onClose} />);

    unmount();
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.scroll(window);
    window.dispatchEvent(new Event('blur'));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('clamps a small position to the viewport margin (left/top floor)', () => {
    // In jsdom the menu measures as 0x0, so any negative requested position
    // is floored to VIEWPORT_MARGIN (8px).
    const { container } = render(
      <ContextMenu x={-100} y={-100} items={[makeItem()]} onClose={vi.fn()} />,
    );
    const menu = container.querySelector('[role="menu"]') as HTMLElement;
    expect(menu.style.left).toBe('8px');
    expect(menu.style.top).toBe('8px');
  });

  it('clamps a far position back inside the viewport (right/bottom ceiling)', () => {
    // window.innerWidth defaults to 1024, innerHeight to 768 in jsdom.
    // With a 0x0 rect, maxX = innerWidth - 0 - 8, so x is clamped to that.
    const { container } = render(
      <ContextMenu x={99999} y={99999} items={[makeItem()]} onClose={vi.fn()} />,
    );
    const menu = container.querySelector('[role="menu"]') as HTMLElement;
    const left = Number.parseInt(menu.style.left, 10);
    const top = Number.parseInt(menu.style.top, 10);
    expect(left).toBe(window.innerWidth - 8);
    expect(top).toBe(window.innerHeight - 8);
  });

  it('keeps an in-bounds position unchanged after clamping', () => {
    const { container } = render(
      <ContextMenu x={120} y={64} items={[makeItem()]} onClose={vi.fn()} />,
    );
    const menu = container.querySelector('[role="menu"]') as HTMLElement;
    expect(menu.style.left).toBe('120px');
    expect(menu.style.top).toBe('64px');
  });

  it('ArrowDown / ArrowUp move focus among enabled items, skipping disabled', () => {
    render(
      <ContextMenu
        x={0}
        y={0}
        items={[
          makeItem({ label: 'One' }),
          makeItem({ label: 'Two', disabled: true }),
          makeItem({ label: 'Three' }),
        ]}
        onClose={vi.fn()}
      />,
    );

    const menu = screen.getByRole('menu');
    const one = screen.getByText('One');
    const three = screen.getByText('Three');

    // First enabled item is focused on mount.
    expect(document.activeElement).toBe(one);

    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(three);

    // Wraps back around to the first enabled item.
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(one);

    fireEvent.keyDown(menu, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(three);
  });

  it('focuses the first enabled item on mount', () => {
    render(
      <ContextMenu
        x={0}
        y={0}
        items={[makeItem({ label: 'Disabled', disabled: true }), makeItem({ label: 'Enabled' })]}
        onClose={vi.fn()}
      />,
    );
    expect(document.activeElement).toBe(screen.getByText('Enabled'));
  });
});
