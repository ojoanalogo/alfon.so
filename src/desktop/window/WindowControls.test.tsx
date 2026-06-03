import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WindowControls from './WindowControls';

describe('WindowControls', () => {
  it('renders three control buttons inside a labelled group', () => {
    const { container } = render(
      <WindowControls onClose={vi.fn()} onMinimize={vi.fn()} onToggleMaximize={vi.fn()} />,
    );

    const group = container.querySelector('[role="group"]');
    expect(group).toBeTruthy();
    expect(group?.getAttribute('aria-label')).toBe('Controles de ventana');

    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(3);
    buttons.forEach((btn) => expect(btn.getAttribute('type')).toBe('button'));
  });

  it('fires onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    const onMinimize = vi.fn();
    const onToggleMaximize = vi.fn();
    render(
      <WindowControls
        onClose={onClose}
        onMinimize={onMinimize}
        onToggleMaximize={onToggleMaximize}
      />,
    );

    fireEvent.click(screen.getByLabelText('Cerrar ventana'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onMinimize).not.toHaveBeenCalled();
    expect(onToggleMaximize).not.toHaveBeenCalled();
  });

  it('fires onMinimize when the minimize button is clicked', () => {
    const onClose = vi.fn();
    const onMinimize = vi.fn();
    const onToggleMaximize = vi.fn();
    render(
      <WindowControls
        onClose={onClose}
        onMinimize={onMinimize}
        onToggleMaximize={onToggleMaximize}
      />,
    );

    fireEvent.click(screen.getByLabelText('Minimizar ventana'));

    expect(onMinimize).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
    expect(onToggleMaximize).not.toHaveBeenCalled();
  });

  it('fires onToggleMaximize when the maximize button is clicked', () => {
    const onClose = vi.fn();
    const onMinimize = vi.fn();
    const onToggleMaximize = vi.fn();
    render(
      <WindowControls
        onClose={onClose}
        onMinimize={onMinimize}
        onToggleMaximize={onToggleMaximize}
      />,
    );

    fireEvent.click(screen.getByLabelText('Maximizar ventana'));

    expect(onToggleMaximize).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
    expect(onMinimize).not.toHaveBeenCalled();
  });

  it('stops pointerdown propagation so the drag region is not triggered', () => {
    render(
      <div
        onPointerDown={() => {
          throw new Error('parent pointerDown should not be reached');
        }}
      >
        <WindowControls onClose={vi.fn()} onMinimize={vi.fn()} onToggleMaximize={vi.fn()} />
      </div>,
    );

    // If stopPropagation were missing, the parent handler would throw.
    expect(() =>
      fireEvent.pointerDown(screen.getByLabelText('Cerrar ventana')),
    ).not.toThrow();
  });

  it('each button uses an exact, distinct aria-label', () => {
    render(
      <WindowControls onClose={vi.fn()} onMinimize={vi.fn()} onToggleMaximize={vi.fn()} />,
    );

    expect(screen.getByLabelText('Cerrar ventana')).toBeTruthy();
    expect(screen.getByLabelText('Minimizar ventana')).toBeTruthy();
    expect(screen.getByLabelText('Maximizar ventana')).toBeTruthy();
  });
});
