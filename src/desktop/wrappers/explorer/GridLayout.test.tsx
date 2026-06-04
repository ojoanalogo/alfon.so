import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GridLayout from './GridLayout';
import type { ListItem } from './types';

function item(overrides: Partial<ListItem> = {}): ListItem {
  return { id: 'a', label: 'Alpha', ...overrides };
}

describe('GridLayout', () => {
  it('renders one tile per item with its label', () => {
    const items = [item({ id: 'a', label: 'Alpha' }), item({ id: 'b', label: 'Beta' })];
    render(<GridLayout items={items} onActivate={vi.fn()} />);

    expect(screen.getByText('Alpha')).toBeTruthy();
    expect(screen.getByText('Beta')).toBeTruthy();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('calls onActivate with the item id when a tile is clicked', () => {
    const onActivate = vi.fn();
    render(<GridLayout items={[item({ id: 'tile-1', label: 'Tile' })]} onActivate={onActivate} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onActivate).toHaveBeenCalledWith('tile-1');
  });

  it('renders disabled items as non-clickable cells (no button)', () => {
    const onActivate = vi.fn();
    render(
      <GridLayout
        items={[item({ id: 'x', label: 'Locked', disabled: true })]}
        onActivate={onActivate}
      />,
    );

    expect(screen.queryByRole('button')).toBeNull();
    // Disabled cell is still labelled for a11y.
    const cell = screen.getByLabelText('Locked');
    expect(cell).toBeTruthy();
    fireEvent.click(cell);
    expect(onActivate).not.toHaveBeenCalled();
  });

  it('uses title as tooltip when set, otherwise falls back to label', () => {
    const items = [
      item({ id: 't', label: 'Labelled', title: 'A tooltip' }),
      item({ id: 'n', label: 'NoTitle' }),
    ];
    const { container } = render(<GridLayout items={items} onActivate={vi.fn()} />);
    const buttons = container.querySelectorAll('button');
    expect(buttons[0]?.getAttribute('title')).toBe('A tooltip');
    expect(buttons[1]?.getAttribute('title')).toBe('NoTitle');
  });

  it('uses title (falling back to label) as the tooltip on a disabled cell', () => {
    render(
      <GridLayout
        items={[
          item({ id: 'd', label: 'Locked', title: 'Why locked', disabled: true }),
          item({ id: 'e', label: 'AlsoLocked', disabled: true }),
        ]}
        onActivate={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Locked').getAttribute('title')).toBe('Why locked');
    expect(screen.getByLabelText('AlsoLocked').getAttribute('title')).toBe('AlsoLocked');
  });

  it('renders an optional heading above the grid', () => {
    render(<GridLayout items={[item()]} onActivate={vi.fn()} heading="My Files" />);
    expect(screen.getByText('My Files')).toBeTruthy();
  });

  it('omits the heading element when no heading is given', () => {
    const { container } = render(<GridLayout items={[item()]} onActivate={vi.fn()} />);
    expect(container.querySelector('p')).toBeNull();
  });

  it('renders children below the grid', () => {
    render(
      <GridLayout items={[item()]} onActivate={vi.fn()}>
        <div data-testid="extra">footer content</div>
      </GridLayout>,
    );
    expect(screen.getByTestId('extra')).toBeTruthy();
  });

  it('applies className to the wrapper', () => {
    const { container } = render(
      <GridLayout items={[item()]} onActivate={vi.fn()} className="wrap-cls" />,
    );
    expect(container.querySelector('.wrap-cls')).toBeTruthy();
  });

  it('renders an empty grid without tiles', () => {
    render(<GridLayout items={[]} onActivate={vi.fn()} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
