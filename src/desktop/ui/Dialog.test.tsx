import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Dialog, { clampDialogPosition } from './Dialog';
import { EDGE_MARGIN, TASKBAR_HEIGHT } from '../lib/layoutConstants';

describe('clampDialogPosition', () => {
  // jsdom defaults: innerWidth=1024, innerHeight=768
  const VW = 1024;
  const VH = 768;
  const W = 360;
  const H = 200;

  it('leaves an in-bounds position untouched', () => {
    expect(clampDialogPosition(100, 100, W, H, VW, VH)).toEqual({ x: 100, y: 100 });
  });

  it('clamps the top edge to EDGE_MARGIN so the titlebar stays grabbable', () => {
    expect(clampDialogPosition(100, -500, W, H, VW, VH).y).toBe(EDGE_MARGIN);
  });

  it('clamps the left edge to EDGE_MARGIN', () => {
    expect(clampDialogPosition(-500, 100, W, H, VW, VH).x).toBe(EDGE_MARGIN);
  });

  it('clamps the right edge so the dialog stays fully on-screen', () => {
    expect(clampDialogPosition(5000, 100, W, H, VW, VH).x).toBe(VW - W - EDGE_MARGIN);
  });

  it('clamps the bottom edge above the taskbar', () => {
    expect(clampDialogPosition(100, 5000, W, H, VW, VH).y).toBe(
      VH - TASKBAR_HEIGHT - H - EDGE_MARGIN,
    );
  });

  it('falls back to EDGE_MARGIN when the dialog is larger than the viewport', () => {
    expect(clampDialogPosition(50, 50, 5000, 5000, VW, VH)).toEqual({
      x: EDGE_MARGIN,
      y: EDGE_MARGIN,
    });
  });
});

describe('Dialog', () => {
  function setup(props: Partial<React.ComponentProps<typeof Dialog>> = {}) {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    const utils = render(
      <Dialog
        title="Eliminar nota"
        confirmLabel="Eliminar"
        destructive
        onConfirm={onConfirm}
        onClose={onClose}
        {...props}
      >
        <p>¿Eliminar esta nota?</p>
      </Dialog>,
    );
    return { onClose, onConfirm, ...utils };
  }

  it('renders the title, body, and confirm/cancel buttons', () => {
    setup();
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Eliminar nota')).toBeTruthy();
    expect(screen.getByText('¿Eliminar esta nota?')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeTruthy();
  });

  it('focuses the first actionable control (the close button) on mount', () => {
    setup();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cerrar' }));
  });

  it('fires onConfirm then onClose when the confirm button is clicked', () => {
    const { onConfirm, onClose } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('fires only onClose when cancelled', () => {
    const { onConfirm, onClose } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('fires onClose via the × close button', () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape', () => {
    const { onClose } = setup();
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('omits the confirm button when no onConfirm is given', () => {
    render(
      <Dialog title="Info" onClose={vi.fn()}>
        <p>solo lectura</p>
      </Dialog>,
    );
    expect(screen.queryByRole('button', { name: 'Confirmar' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeTruthy();
  });

  it('starts centered (no inline position) until dragged, then pins to a clamped pixel position', () => {
    setup();
    const dialog = screen.getByRole('dialog');
    expect(dialog.style.left).toBe('');
    expect(dialog.className).toContain('left-1/2');

    // Give the dialog a measurable box so the drag math has real dimensions.
    dialog.getBoundingClientRect = () =>
      ({
        left: 300,
        top: 200,
        width: 360,
        height: 200,
        right: 660,
        bottom: 400,
        x: 300,
        y: 200,
        toJSON: () => ({}),
      }) as DOMRect;

    const titlebar = document.querySelector('[data-dialog-titlebar]') as HTMLElement;
    fireEvent.pointerDown(titlebar, { button: 0, pointerId: 1, clientX: 320, clientY: 210 });

    // Drag far up-left: clientX/Y - grab offset would be negative, so it clamps to EDGE_MARGIN.
    act(() => {
      const evt = new Event('pointermove') as PointerEvent;
      Object.assign(evt, { pointerId: 1, clientX: -100, clientY: -100 });
      window.dispatchEvent(evt);
    });

    expect(dialog.style.left).toBe(`${EDGE_MARGIN}px`);
    expect(dialog.style.top).toBe(`${EDGE_MARGIN}px`);
    expect(dialog.className).not.toContain('left-1/2');
  });

  it('ignores a non-left-button drag start', () => {
    setup();
    const dialog = screen.getByRole('dialog');
    const titlebar = document.querySelector('[data-dialog-titlebar]') as HTMLElement;
    fireEvent.pointerDown(titlebar, { button: 2, pointerId: 1, clientX: 10, clientY: 10 });
    act(() => {
      const evt = new Event('pointermove') as PointerEvent;
      Object.assign(evt, { pointerId: 1, clientX: 500, clientY: 500 });
      window.dispatchEvent(evt);
    });
    // Still centered — the right-click never armed a drag.
    expect(dialog.style.left).toBe('');
  });
});
