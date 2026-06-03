import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExplorerTitleContent from './ExplorerTitleContent';
import { ExplorerViewProvider } from './ExplorerViewContext';
import type { ExplorerViewMode } from './types';

function renderTitle(title = 'Title Text', defaultMode?: ExplorerViewMode) {
  return render(
    <ExplorerViewProvider defaultMode={defaultMode}>
      <ExplorerTitleContent title={title} />
    </ExplorerViewProvider>,
  );
}

describe('ExplorerTitleContent', () => {
  it('renders the title text in a muted, truncating span', () => {
    renderTitle('Documents');
    const span = screen.getByText('Documents');
    expect(span).toBeTruthy();
    expect(span.className.includes('text-muted')).toBe(true);
    expect(span.className.includes('text-ellipsis')).toBe(true);
  });

  it('renders the LayoutSwitcher toolbar', () => {
    renderTitle();
    expect(screen.getByRole('toolbar', { name: 'Cambiar vista' })).toBeTruthy();
    expect(screen.getByTitle('Vista de iconos')).toBeTruthy();
    expect(screen.getByTitle('Vista de lista')).toBeTruthy();
  });

  it('reflects the current grid mode in the switcher (grid pressed by default)', () => {
    renderTitle();
    expect(screen.getByTitle('Vista de iconos').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTitle('Vista de lista').getAttribute('aria-pressed')).toBe('false');
  });

  it('reflects an initial list mode from the provider', () => {
    renderTitle('Title', 'list');
    expect(screen.getByTitle('Vista de lista').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTitle('Vista de iconos').getAttribute('aria-pressed')).toBe('false');
  });

  it('updates the pressed state when a layout button is clicked (setMode wired)', () => {
    renderTitle();
    fireEvent.click(screen.getByTitle('Vista de lista'));
    expect(screen.getByTitle('Vista de lista').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTitle('Vista de iconos').getAttribute('aria-pressed')).toBe('false');
  });

  it('stops pointerdown propagation on the switcher wrapper so titlebar drag is not triggered', () => {
    const { container } = renderTitle();
    // The wrapper div holds the propagation-stopping handler.
    const wrapper = container.querySelector('div.ml-auto') as HTMLElement;
    expect(wrapper).toBeTruthy();

    // Simulate a pointerdown bubbling from inside; assert it does not reach an
    // ancestor listener placed above the rendered fragment.
    let reachedAncestor = false;
    const onAncestorPointerDown = () => {
      reachedAncestor = true;
    };
    const outer = container.parentElement as HTMLElement;
    outer.addEventListener('pointerdown', onAncestorPointerDown);

    fireEvent.pointerDown(wrapper);
    expect(reachedAncestor).toBe(false);

    outer.removeEventListener('pointerdown', onAncestorPointerDown);
  });

  it('throws if rendered without an ExplorerViewProvider', () => {
    // useExplorerView guards against missing context.
    expect(() => render(<ExplorerTitleContent title="x" />)).toThrow(
      /useExplorerView must be used within ExplorerViewProvider/,
    );
  });
});
