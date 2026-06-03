import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Window from './Window';
import { makeWindowChromeProps, makeWindowState } from '@test/factories';

function renderWindow(overrides = {}, { title = 'My Window', children = <p>hello body</p> } = {}) {
  const props = makeWindowChromeProps({
    state: makeWindowState({ open: true }),
    ...overrides,
  });
  const utils = render(
    <Window title={title} {...props}>
      {children}
    </Window>,
  );
  return { ...utils, props };
}

describe('Window', () => {
  it('renders the title text in the titlebar', () => {
    renderWindow();
    expect(screen.getByText('My Window')).toBeTruthy();
  });

  it('renders children in the body', () => {
    renderWindow();
    expect(screen.getByText('hello body')).toBeTruthy();
  });

  it('prefers titleContent over the title string when provided', () => {
    const props = makeWindowChromeProps({ state: makeWindowState({ open: true }) });
    render(
      <Window title="Plain Title" titleContent={<span>custom node</span>} {...props}>
        <p>body</p>
      </Window>,
    );
    expect(screen.getByText('custom node')).toBeTruthy();
    expect(screen.queryByText('Plain Title')).toBeNull();
  });

  it('exposes the window id via data-window-id', () => {
    const { container } = renderWindow({ state: makeWindowState({ open: true, id: 'abc' }) });
    expect(container.querySelector('[data-window-id="abc"]')).toBeTruthy();
  });

  it('renders all 8 resize handles when not maximized', () => {
    const { container } = renderWindow({
      state: makeWindowState({ open: true, maximized: false }),
    });
    const handles = container.querySelectorAll('.desktop-window__resize');
    expect(handles.length).toBe(8);
    for (const dir of ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']) {
      expect(container.querySelector(`.desktop-window__resize--${dir}`)).toBeTruthy();
    }
  });

  it('renders no resize handles when maximized', () => {
    const { container } = renderWindow({
      state: makeWindowState({ open: true, maximized: true }),
    });
    expect(container.querySelectorAll('.desktop-window__resize').length).toBe(0);
  });

  it('wires the close control to onClose', () => {
    const onClose = vi.fn();
    renderWindow({ onClose });
    fireEvent.click(screen.getByLabelText('Cerrar ventana'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('wires the minimize control to onMinimize', () => {
    const onMinimize = vi.fn();
    renderWindow({ onMinimize });
    fireEvent.click(screen.getByLabelText('Minimizar ventana'));
    expect(onMinimize).toHaveBeenCalledTimes(1);
  });

  it('wires the maximize control to onToggleMaximize', () => {
    const onToggleMaximize = vi.fn();
    renderWindow({ onToggleMaximize });
    fireEvent.click(screen.getByLabelText('Maximizar ventana'));
    expect(onToggleMaximize).toHaveBeenCalledTimes(1);
  });

  it('toggles maximize when the titlebar drag region is double-clicked', () => {
    const onToggleMaximize = vi.fn();
    const { container } = renderWindow({ onToggleMaximize });
    const drag = container.querySelector('.window-titlebar__drag') as HTMLElement;
    expect(drag).toBeTruthy();
    fireEvent.doubleClick(drag);
    expect(onToggleMaximize).toHaveBeenCalledTimes(1);
  });

  it('calls onFocus when the root section receives a pointer down', () => {
    const onFocus = vi.fn();
    const { container } = renderWindow({ onFocus });
    const root = container.querySelector('[data-window-id]') as HTMLElement;
    fireEvent.pointerDown(root);
    expect(onFocus).toHaveBeenCalled();
  });

  it('marks the section interactive (not aria-hidden / not inert) when open and not minimized', () => {
    const { container } = renderWindow({
      state: makeWindowState({ open: true, minimized: false }),
    });
    const root = container.querySelector('[data-window-id]') as HTMLElement;
    expect(root.getAttribute('aria-hidden')).toBe('false');
    expect(root.hasAttribute('inert')).toBe(false);
  });

  it('marks the section non-interactive (aria-hidden + inert) when minimized', () => {
    const { container } = renderWindow({
      state: makeWindowState({ open: true, minimized: true }),
    });
    const root = container.querySelector('[data-window-id]') as HTMLElement;
    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(root.hasAttribute('inert')).toBe(true);
  });

  it('renders a focus-capture overlay when interactive but not focused', () => {
    const onFocus = vi.fn();
    const { container } = renderWindow({
      focused: false,
      onFocus,
      state: makeWindowState({ open: true, minimized: false }),
    });
    const overlay = container.querySelector('.card-body [aria-hidden="true"]') as HTMLElement;
    expect(overlay).toBeTruthy();
    fireEvent.pointerDown(overlay);
    // overlay pointerdown also triggers focus
    expect(onFocus).toHaveBeenCalled();
  });

  it('omits the focus-capture overlay when the window is focused', () => {
    const { container } = renderWindow({
      focused: true,
      state: makeWindowState({ open: true, minimized: false }),
    });
    // The card-body should only contain the children, no inset overlay div
    const overlay = container.querySelector('.card-body > div.absolute.inset-0');
    expect(overlay).toBeNull();
  });

  it('applies the is-focused class when focused', () => {
    const { container } = renderWindow({ focused: true, state: makeWindowState({ open: true }) });
    const root = container.querySelector('[data-window-id]') as HTMLElement;
    expect(root.className.includes('is-focused')).toBe(true);
  });

  it('applies the expanded class when maximized', () => {
    const { container } = renderWindow({
      state: makeWindowState({ open: true, maximized: true }),
    });
    const root = container.querySelector('[data-window-id]') as HTMLElement;
    expect(root.className.includes('desktop-window--expanded')).toBe(true);
  });

  it('forwards a custom windowClassName onto the root', () => {
    const props = makeWindowChromeProps({ state: makeWindowState({ open: true }) });
    const { container } = render(
      <Window title="t" windowClassName="my-custom-class" {...props}>
        <p>x</p>
      </Window>,
    );
    const root = container.querySelector('[data-window-id]') as HTMLElement;
    expect(root.className.includes('my-custom-class')).toBe(true);
  });

  it('applies bodyClassName to the card body', () => {
    const props = makeWindowChromeProps({ state: makeWindowState({ open: true }) });
    const { container } = render(
      <Window title="t" bodyClassName="extra-body" {...props}>
        <p>x</p>
      </Window>,
    );
    const body = container.querySelector('.card-body') as HTMLElement;
    expect(body.className.includes('extra-body')).toBe(true);
  });
});
