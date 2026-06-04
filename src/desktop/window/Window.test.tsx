import { describe, it, expect, vi } from 'vitest';
import { useEffect } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Window from './Window';
import { makeWindowChromeProps, makeWindowState } from '@test/factories';

function Probe({ onMount }: { onMount: () => void }) {
  useEffect(() => {
    onMount();
  }, [onMount]);
  return <p>probe-body</p>;
}

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
    // The card-body should only contain the children, no focus-capture overlay.
    // (Mirrors the semantic selector used by the "renders a focus-capture
    // overlay" test above, instead of pinning Tailwind utility classes.)
    const overlay = container.querySelector('.card-body [aria-hidden="true"]');
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

describe('Window - width sync', () => {
  it('corrects a drifted width via onGeometryChange when not user-sized', () => {
    const onGeometryChange = vi.fn();
    // defaultWidth 600 resolves to 600 at the 1024 jsdom viewport; state.width is 800.
    renderWindow({
      state: makeWindowState({ open: true, width: 800, userSized: false }),
      defaultWidth: 600,
      onGeometryChange,
    });
    expect(onGeometryChange).toHaveBeenCalledWith({ width: 600 });
  });

  it('does not correct width when the window is user-sized', () => {
    const onGeometryChange = vi.fn();
    renderWindow({
      state: makeWindowState({ open: true, width: 800, userSized: true }),
      defaultWidth: 600,
      onGeometryChange,
    });
    expect(onGeometryChange).not.toHaveBeenCalled();
  });

  it('does not run width sync for centered windows', () => {
    const onGeometryChange = vi.fn();
    renderWindow({
      state: makeWindowState({ open: true, width: 800, userSized: false }),
      defaultWidth: 600,
      center: true,
      onGeometryChange,
    });
    expect(onGeometryChange).not.toHaveBeenCalledWith({ width: 600 });
  });
});

describe('Window - maximize display', () => {
  it('renders a full-bleed box when the window starts maximized', () => {
    const { container } = renderWindow({
      state: makeWindowState({ open: true, maximized: true }),
    });
    const root = container.querySelector('.desktop-window') as HTMLElement;
    expect(root.style.left).toBe('0px');
    expect(root.style.width).toBe('auto');
    expect(root.style.height).toBe('auto');
  });

  it('renders a positioned box (not full-bleed) when not maximized', () => {
    const { container } = renderWindow({
      state: makeWindowState({ open: true, maximized: false, x: 120, y: 80, width: 600 }),
      defaultWidth: 600,
    });
    const root = container.querySelector('.desktop-window') as HTMLElement;
    expect(root.style.left).toBe('120px');
    expect(root.style.width).toBe('600px');
  });
});

describe('Window - body mounting (lazy until first open, then kept mounted)', () => {
  it('does not mount the body for a window that has never been opened', () => {
    const onMount = vi.fn();
    renderWindow(
      { state: makeWindowState({ open: false }) },
      { children: <Probe onMount={onMount} /> },
    );
    expect(screen.queryByText('probe-body')).toBeNull();
    expect(onMount).not.toHaveBeenCalled();
  });

  it('mounts the body once the window is open', () => {
    const onMount = vi.fn();
    renderWindow(
      { state: makeWindowState({ open: true }) },
      { children: <Probe onMount={onMount} /> },
    );
    expect(screen.getByText('probe-body')).toBeTruthy();
    expect(onMount).toHaveBeenCalledOnce();
  });

  it('keeps the body mounted across close then reopen (state survives)', () => {
    const onMount = vi.fn();
    const body = <Probe onMount={onMount} />;
    const open = makeWindowChromeProps({ state: makeWindowState({ id: 'w', open: true }) });
    const closed = makeWindowChromeProps({ state: makeWindowState({ id: 'w', open: false }) });

    const { rerender } = render(
      <Window title="t" {...open}>
        {body}
      </Window>,
    );
    expect(onMount).toHaveBeenCalledOnce();

    rerender(
      <Window title="t" {...closed}>
        {body}
      </Window>,
    );
    rerender(
      <Window title="t" {...open}>
        {body}
      </Window>,
    );

    // Mounted exactly once — not torn down on close, not remounted on reopen.
    expect(onMount).toHaveBeenCalledOnce();
    expect(screen.getByText('probe-body')).toBeTruthy();
  });
});

describe('Window - sized class', () => {
  it('is-sized when the window has a fixed height', () => {
    const { container } = renderWindow({ state: makeWindowState({ open: true, height: 400 }) });
    expect(container.querySelector('.desktop-window')!.className.includes('is-sized')).toBe(true);
  });

  it('is-sized when content-sized with a min-height floor', () => {
    const { container } = renderWindow({
      state: makeWindowState({ open: true, height: null }),
      minHeight: 200,
    });
    expect(container.querySelector('.desktop-window')!.className.includes('is-sized')).toBe(true);
  });

  it('not is-sized when content-sized without a floor', () => {
    const { container } = renderWindow({
      state: makeWindowState({ open: true, height: null }),
      minHeight: undefined,
    });
    expect(container.querySelector('.desktop-window')!.className.includes('is-sized')).toBe(false);
  });
});
