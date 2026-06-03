import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import ListItemIcon from './ListItemIcon';
import type { ListItem } from './types';

function item(overrides: Partial<ListItem> = {}): ListItem {
  return { id: 'a', label: 'Alpha', ...overrides };
}

describe('ListItemIcon', () => {
  it('renders an <img> with the given src and size when iconSrc is set', () => {
    const { container } = render(
      <ListItemIcon item={item({ iconSrc: '/icons/folder.png' })} size={16} />,
    );
    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    expect(img?.getAttribute('src')).toBe('/icons/folder.png');
    expect(img?.getAttribute('width')).toBe('16');
    expect(img?.getAttribute('height')).toBe('16');
    // Decorative: empty alt + lazy/async hints.
    expect(img?.getAttribute('alt')).toBe('');
    expect(img?.getAttribute('loading')).toBe('lazy');
    expect(img?.getAttribute('decoding')).toBe('async');
  });

  it('applies imgClassName to the <img>', () => {
    const { container } = render(
      <ListItemIcon
        item={item({ iconSrc: '/icons/x.svg' })}
        size={32}
        imgClassName="h-8 w-8 pixelated"
      />,
    );
    const img = container.querySelector('img');
    expect(img?.getAttribute('class')).toBe('h-8 w-8 pixelated');
  });

  it('prefers iconSrc over graphic when both are present', () => {
    const { container } = render(
      <ListItemIcon item={item({ iconSrc: '/icons/y.png', graphic: '📁' })} size={16} />,
    );
    expect(container.querySelector('img')).toBeTruthy();
    expect(container.textContent).not.toContain('📁');
  });

  it('renders the graphic node when no iconSrc is set', () => {
    const { container } = render(<ListItemIcon item={item({ graphic: '📄' })} size={16} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('📄');
  });

  it('renders a JSX graphic node', () => {
    const { container } = render(
      <ListItemIcon item={item({ graphic: <span data-testid="custom">node</span> })} size={16} />,
    );
    expect(container.querySelector('[data-testid="custom"]')).toBeTruthy();
  });

  it('renders nothing when neither iconSrc nor graphic is set', () => {
    const { container } = render(<ListItemIcon item={item()} size={16} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toBe('');
  });
});
