import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WindowTitlebar from './WindowTitlebar';

describe('WindowTitlebar', () => {
  it('renders the title text when no titleContent is provided', () => {
    render(<WindowTitlebar title="My Window" onMoveStart={vi.fn()} onDoubleClick={vi.fn()} />);

    expect(screen.getByText('My Window')).toBeTruthy();
  });

  it('renders the drag region element', () => {
    const { container } = render(
      <WindowTitlebar title="Drag me" onMoveStart={vi.fn()} onDoubleClick={vi.fn()} />,
    );

    const drag = container.querySelector('.window-titlebar__drag');
    expect(drag).toBeTruthy();
  });

  it('prefers titleContent over the plain title when provided', () => {
    const { container } = render(
      <WindowTitlebar
        title="Plain Title"
        titleContent={<span data-testid="custom">Custom Content</span>}
        onMoveStart={vi.fn()}
        onDoubleClick={vi.fn()}
      />,
    );

    expect(screen.getByTestId('custom')).toBeTruthy();
    expect(screen.getByText('Custom Content')).toBeTruthy();
    // The default title span should not be rendered.
    expect(screen.queryByText('Plain Title')).toBeNull();
    // The default muted title span is replaced.
    expect(container.querySelector('.text-muted')).toBeNull();
  });

  it('calls onMoveStart on pointer down over the drag region', () => {
    const onMoveStart = vi.fn();
    const { container } = render(
      <WindowTitlebar title="t" onMoveStart={onMoveStart} onDoubleClick={vi.fn()} />,
    );

    const drag = container.querySelector('.window-titlebar__drag') as Element;
    fireEvent.pointerDown(drag);

    expect(onMoveStart).toHaveBeenCalledTimes(1);
  });

  it('calls onDoubleClick when the drag region is double-clicked', () => {
    const onDoubleClick = vi.fn();
    const { container } = render(
      <WindowTitlebar title="t" onMoveStart={vi.fn()} onDoubleClick={onDoubleClick} />,
    );

    const drag = container.querySelector('.window-titlebar__drag') as Element;
    fireEvent.doubleClick(drag);

    expect(onDoubleClick).toHaveBeenCalledTimes(1);
  });

  it('renders an empty title without crashing', () => {
    const { container } = render(
      <WindowTitlebar title="" onMoveStart={vi.fn()} onDoubleClick={vi.fn()} />,
    );

    const span = container.querySelector('.text-muted');
    expect(span).toBeTruthy();
    expect(span?.textContent).toBe('');
  });
});
