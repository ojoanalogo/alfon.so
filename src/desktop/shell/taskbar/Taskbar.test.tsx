import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../../state/ThemeContext';
import Taskbar from './Taskbar';
import { makeWindowState } from '@test/factories';
import { stubMatchMedia } from '@test/helpers';
import { SITE_TITLE } from '@/config';
import type { WindowMeta } from '../../types';

beforeEach(() => {
  localStorage.clear();
  stubMatchMedia();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function meta(overrides: Partial<WindowMeta> = {}): WindowMeta {
  return { iconSrc: '/icon.png', label: 'Window', ...overrides };
}

function makeProps(overrides: Partial<React.ComponentProps<typeof Taskbar>> = {}) {
  return {
    windows: {},
    order: [],
    focusedId: null,
    meta: {},
    startMenuApps: [],
    onSelect: vi.fn(),
    onMinimize: vi.fn(),
    onClose: vi.fn(),
    onOpenExternal: vi.fn(),
    onOpenWindow: vi.fn(),
    onCloseAllWindows: vi.fn(),
    ...overrides,
  };
}

function renderTaskbar(props: ReturnType<typeof makeProps>) {
  return render(
    <ThemeProvider>
      <Taskbar {...props} />
    </ThemeProvider>,
  );
}

describe('Taskbar', () => {
  it('renders no window buttons when there are no open windows', () => {
    const { container } = renderTaskbar(makeProps());
    expect(container.querySelector('[data-taskbar-window]')).toBeNull();
  });

  it('renders a button per open window in order', () => {
    const props = makeProps({
      windows: {
        a: makeWindowState({ id: 'a', open: true }),
        b: makeWindowState({ id: 'b', open: true }),
      },
      order: ['a', 'b'],
      meta: { a: meta({ label: 'Alpha' }), b: meta({ label: 'Beta' }) },
    });
    const { container } = renderTaskbar(props);

    const buttons = container.querySelectorAll('[data-taskbar-window]');
    expect(buttons.length).toBe(2);
    expect(buttons[0].getAttribute('data-taskbar-window')).toBe('a');
    expect(buttons[1].getAttribute('data-taskbar-window')).toBe('b');
    expect(screen.getByText('Alpha')).toBeTruthy();
    expect(screen.getByText('Beta')).toBeTruthy();
  });

  it('does not render buttons for closed windows', () => {
    const props = makeProps({
      windows: {
        a: makeWindowState({ id: 'a', open: true }),
        b: makeWindowState({ id: 'b', open: false }),
      },
      order: ['a', 'b'],
      meta: { a: meta(), b: meta() },
    });
    const { container } = renderTaskbar(props);
    expect(container.querySelectorAll('[data-taskbar-window]').length).toBe(1);
    expect(container.querySelector('[data-taskbar-window="a"]')).toBeTruthy();
    expect(container.querySelector('[data-taskbar-window="b"]')).toBeNull();
  });

  it('skips open windows that have no meta entry', () => {
    const props = makeProps({
      windows: { a: makeWindowState({ id: 'a', open: true }) },
      order: ['a'],
      meta: {},
    });
    const { container } = renderTaskbar(props);
    expect(container.querySelectorAll('[data-taskbar-window]').length).toBe(0);
  });

  it('calls onSelect with the window id when a window button is clicked', () => {
    const onSelect = vi.fn();
    const props = makeProps({
      windows: { a: makeWindowState({ id: 'a', open: true }) },
      order: ['a'],
      meta: { a: meta({ label: 'Alpha' }) },
      onSelect,
    });
    const { container } = renderTaskbar(props);

    fireEvent.click(container.querySelector('[data-taskbar-window="a"]')!);
    expect(onSelect).toHaveBeenCalledWith('a');
  });

  it('uses tooltip when provided, otherwise falls back to label', () => {
    const props = makeProps({
      windows: {
        a: makeWindowState({ id: 'a', open: true }),
        b: makeWindowState({ id: 'b', open: true }),
      },
      order: ['a', 'b'],
      meta: {
        a: meta({ label: 'Alpha', tooltip: 'Alpha tooltip' }),
        b: meta({ label: 'Beta' }),
      },
    });
    const { container } = renderTaskbar(props);

    expect(container.querySelector('[data-taskbar-window="a"]')!.getAttribute('title')).toBe(
      'Alpha tooltip',
    );
    expect(container.querySelector('[data-taskbar-window="b"]')!.getAttribute('title')).toBe(
      'Beta',
    );
  });

  it('renders the start button with the site title and collapsed state', () => {
    const { container } = renderTaskbar(makeProps());
    const startButton = container.querySelector(
      'button[aria-haspopup="menu"]',
    ) as HTMLButtonElement;

    expect(startButton).toBeTruthy();
    expect(startButton.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByText(SITE_TITLE)).toBeTruthy();
  });

  it('toggles the start menu open and closed on start button click', () => {
    const { container } = renderTaskbar(makeProps());
    const startButton = container.querySelector(
      'button[aria-haspopup="menu"]',
    ) as HTMLButtonElement;

    // open
    fireEvent.click(startButton);
    expect(startButton.getAttribute('aria-expanded')).toBe('true');

    // close again
    fireEvent.click(startButton);
    expect(startButton.getAttribute('aria-expanded')).toBe('false');
  });

  it('marks the focused, non-minimized window button with the highlight class', () => {
    const props = makeProps({
      windows: {
        a: makeWindowState({ id: 'a', open: true, minimized: false }),
        b: makeWindowState({ id: 'b', open: true, minimized: false }),
      },
      order: ['a', 'b'],
      focusedId: 'a',
      meta: { a: meta(), b: meta() },
    });
    const { container } = renderTaskbar(props);

    const focused = container.querySelector('[data-taskbar-window="a"]')!;
    const unfocused = container.querySelector('[data-taskbar-window="b"]')!;
    expect(focused.getAttribute('data-focused')).toBe('true');
    expect(unfocused.getAttribute('data-focused')).not.toBe('true');
  });

  it('does not highlight a focused window when it is minimized', () => {
    const props = makeProps({
      windows: { a: makeWindowState({ id: 'a', open: true, minimized: true }) },
      order: ['a'],
      focusedId: 'a',
      meta: { a: meta() },
    });
    const { container } = renderTaskbar(props);

    const btn = container.querySelector('[data-taskbar-window="a"]')!;
    expect(btn.getAttribute('data-focused')).not.toBe('true');
    expect(btn.getAttribute('data-minimized')).toBe('true');
  });

  it('opens a context menu on right-click with Minimize/Close for an open window', () => {
    const onMinimize = vi.fn();
    const props = makeProps({
      windows: { a: makeWindowState({ id: 'a', open: true, minimized: false }) },
      order: ['a'],
      meta: { a: meta() },
      onMinimize,
    });
    const { container } = renderTaskbar(props);

    fireEvent.contextMenu(container.querySelector('[data-taskbar-window="a"]')!, {
      clientX: 10,
      clientY: 10,
    });

    const minimize = screen.getByText('Minimizar');
    expect(minimize).toBeTruthy();
    expect(screen.getByText('Cerrar')).toBeTruthy();

    fireEvent.click(minimize);
    expect(onMinimize).toHaveBeenCalledWith('a');
  });

  it('shows Restore (not Minimize) in the context menu for a minimized window', () => {
    const onSelect = vi.fn();
    const props = makeProps({
      windows: { a: makeWindowState({ id: 'a', open: true, minimized: true }) },
      order: ['a'],
      focusedId: null,
      meta: { a: meta() },
      onSelect,
    });
    const { container } = renderTaskbar(props);

    fireEvent.contextMenu(container.querySelector('[data-taskbar-window="a"]')!, {
      clientX: 10,
      clientY: 10,
    });

    const restore = screen.getByText('Restaurar');
    expect(restore).toBeTruthy();
    fireEvent.click(restore);
    expect(onSelect).toHaveBeenCalledWith('a');
  });
});
