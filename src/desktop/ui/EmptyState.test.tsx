import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('renders the description text', () => {
    render(<EmptyState description="Nothing here yet" />);
    expect(screen.getByText('Nothing here yet')).toBeTruthy();
  });

  it('renders the icon when provided', () => {
    const { container } = render(
      <EmptyState description="No items" icon={<svg data-testid="empty-icon" />} />,
    );
    expect(container.querySelector('[data-testid="empty-icon"]')).toBeTruthy();
  });

  it('omits the icon wrapper when no icon is given', () => {
    const { container } = render(<EmptyState description="No items" />);
    // The icon wrapper has the [&_svg] sizing class only in non-compact mode.
    expect(container.querySelector('svg')).toBeNull();
  });

  it('renders the action node when provided', () => {
    render(<EmptyState description="No items" action={<button type="button">Retry</button>} />);
    expect(screen.getByText('Retry')).toBeTruthy();
  });

  it('does not render an action when none is provided', () => {
    const { container } = render(<EmptyState description="No items" />);
    expect(container.querySelector('button')).toBeNull();
  });

  it('uses centered layout classes by default (non-compact)', () => {
    const { container } = render(<EmptyState description="Centered" />);
    const root = container.querySelector('.empty-state') as HTMLElement;
    expect(root).toBeTruthy();
    expect(root.className).toContain('items-center');
    expect(root.className).toContain('justify-center');
    expect(root.className).toContain('text-center');
    expect(root.className).not.toContain('items-start');
  });

  it('uses tighter left-aligned layout when compact', () => {
    const { container } = render(<EmptyState description="Compact" compact />);
    const root = container.querySelector('.empty-state') as HTMLElement;
    expect(root.className).toContain('items-start');
    expect(root.className).toContain('text-left');
    expect(root.className).not.toContain('items-center');
  });

  it('applies a smaller description font in compact mode', () => {
    const { container } = render(<EmptyState description="Tiny" compact />);
    const root = container.querySelector('.empty-state') as HTMLElement;
    expect(root.getAttribute('data-compact')).toBe('true');
  });

  it('applies the larger description font in non-compact mode', () => {
    const { container } = render(<EmptyState description="Big" />);
    const root = container.querySelector('.empty-state') as HTMLElement;
    expect(root.getAttribute('data-compact')).toBeNull();
  });

  it('gives the icon wrapper svg sizing classes only in non-compact mode', () => {
    const { container: normal } = render(<EmptyState description="x" icon={<svg />} />);
    const normalWrapper = normal.querySelector('p')!.previousElementSibling as HTMLElement;
    expect(normalWrapper.className).toContain('[&_svg]:h-10');

    const { container: compact } = render(<EmptyState description="x" icon={<svg />} compact />);
    const compactWrapper = compact.querySelector('p')!.previousElementSibling as HTMLElement;
    expect(compactWrapper.className).toBe('text-muted');
  });

  it('appends an extra className when provided', () => {
    const { container } = render(<EmptyState description="x" className="custom-cls" />);
    const root = container.querySelector('.empty-state') as HTMLElement;
    expect(root.className).toContain('custom-cls');
  });
});
