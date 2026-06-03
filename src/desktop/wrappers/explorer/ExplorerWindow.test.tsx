import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExplorerWindow from './ExplorerWindow';
import type { ExplorerViewMode } from './types';
import { makeWindowChromeProps, makeWindowState } from '@test/factories';

function renderExplorer(
  overrides: Record<string, unknown> = {},
  {
    title = 'My Explorer',
    children = <p>explorer body</p>,
    defaultMode,
    bodyClassName,
  }: {
    title?: string;
    children?: React.ReactNode;
    defaultMode?: ExplorerViewMode;
    bodyClassName?: string;
  } = {},
) {
  const props = makeWindowChromeProps({
    state: makeWindowState({ open: true }),
    ...overrides,
  });
  const utils = render(
    <ExplorerWindow
      title={title}
      defaultMode={defaultMode}
      bodyClassName={bodyClassName}
      {...props}
    >
      {children}
    </ExplorerWindow>,
  );
  return { ...utils, props };
}

describe('ExplorerWindow', () => {
  it('renders the title text from the explorer titlebar content', () => {
    renderExplorer({}, { title: 'Projects' });
    // The title appears in ExplorerTitleContent's span (via titleContent),
    // not the default Window title text.
    expect(screen.getByText('Projects')).toBeTruthy();
  });

  it('renders the provided children inside the window body', () => {
    renderExplorer({}, { children: <span>my children node</span> });
    expect(screen.getByText('my children node')).toBeTruthy();
  });

  it('renders the LayoutSwitcher toolbar in the titlebar', () => {
    renderExplorer();
    expect(screen.getByRole('toolbar', { name: 'Cambiar vista' })).toBeTruthy();
    expect(screen.getByTitle('Vista de iconos')).toBeTruthy();
    expect(screen.getByTitle('Vista de lista')).toBeTruthy();
  });

  it('defaults to grid mode: grid layout body class + grid button pressed', () => {
    const { container } = renderExplorer();
    const body = container.querySelector('.card-body') as HTMLElement;
    expect(body.className.includes('card-body--explorer-grid')).toBe(true);
    expect(body.className.includes('card-body--explorer-list')).toBe(false);
    expect(screen.getByTitle('Vista de iconos').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTitle('Vista de lista').getAttribute('aria-pressed')).toBe('false');
  });

  it('honors defaultMode="list": list layout body class + list button pressed', () => {
    const { container } = renderExplorer({}, { defaultMode: 'list' });
    const body = container.querySelector('.card-body') as HTMLElement;
    expect(body.className.includes('card-body--explorer-list')).toBe(true);
    expect(body.className.includes('card-body--explorer-grid')).toBe(false);
    expect(screen.getByTitle('Vista de lista').getAttribute('aria-pressed')).toBe('true');
  });

  it('switches the body layout class when the list button is clicked', () => {
    const { container } = renderExplorer();
    const body = container.querySelector('.card-body') as HTMLElement;
    expect(body.className.includes('card-body--explorer-grid')).toBe(true);

    fireEvent.click(screen.getByTitle('Vista de lista'));

    const bodyAfter = container.querySelector('.card-body') as HTMLElement;
    expect(bodyAfter.className.includes('card-body--explorer-list')).toBe(true);
    expect(bodyAfter.className.includes('card-body--explorer-grid')).toBe(false);
    expect(screen.getByTitle('Vista de lista').getAttribute('aria-pressed')).toBe('true');
  });

  it('switches back to grid when the grid button is clicked from list mode', () => {
    const { container } = renderExplorer({}, { defaultMode: 'list' });
    fireEvent.click(screen.getByTitle('Vista de iconos'));
    const body = container.querySelector('.card-body') as HTMLElement;
    expect(body.className.includes('card-body--explorer-grid')).toBe(true);
    expect(screen.getByTitle('Vista de iconos').getAttribute('aria-pressed')).toBe('true');
  });

  it('merges a caller-supplied bodyClassName with the layout class', () => {
    const { container } = renderExplorer({}, { bodyClassName: 'caller-body' });
    const body = container.querySelector('.card-body') as HTMLElement;
    expect(body.className.includes('caller-body')).toBe(true);
    expect(body.className.includes('card-body--explorer-grid')).toBe(true);
  });

  it('forwards window chrome props: id is exposed via data-window-id', () => {
    const { container } = renderExplorer({
      state: makeWindowState({ open: true, id: 'explorer-1' }),
    });
    expect(container.querySelector('[data-window-id="explorer-1"]')).toBeTruthy();
  });

  it('forwards the close handler to the window controls', () => {
    const onClose = vi.fn();
    renderExplorer({ onClose });
    fireEvent.click(screen.getByLabelText('Cerrar ventana'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render the plain Window title text (titleContent replaces it)', () => {
    const { container } = renderExplorer({}, { title: 'Replaced Title' });
    // Title only appears once, inside the explorer title span (the muted span),
    // never as the default Window title node.
    const matches = screen.getAllByText('Replaced Title');
    expect(matches.length).toBe(1);
    expect(matches[0].className.includes('text-muted')).toBe(true);
    // sanity: the body still got an explorer layout class
    expect(container.querySelector('.card-body--explorer-grid')).toBeTruthy();
  });
});
