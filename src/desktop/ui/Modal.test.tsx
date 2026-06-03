import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from './Modal';

describe('Modal', () => {
  it('renders title and children content', () => {
    render(
      <Modal title="My Title" onClose={() => {}}>
        <p>body content</p>
      </Modal>,
    );
    expect(screen.getByText('My Title')).toBeTruthy();
    expect(screen.getByText('body content')).toBeTruthy();
  });

  it('exposes an accessible dialog with the title as its label', () => {
    const { container } = render(
      <Modal title="Accessible" onClose={() => {}}>
        <span>x</span>
      </Modal>,
    );
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(dialog?.getAttribute('data-overlay-root')).not.toBeNull();
    expect(screen.getByText('Accessible').id).toBe('desktop-modal-title');
  });

  it('invokes onClose when the header close (×) button is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal title="t" onClose={onClose}>
        <span>x</span>
      </Modal>,
    );
    fireEvent.click(screen.getByLabelText('Cerrar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('invokes onClose when the cancel/close footer button is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal title="t" onClose={onClose}>
        <span>x</span>
      </Modal>,
    );
    fireEvent.click(screen.getByText('Cancelar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('uses a custom cancelLabel when provided', () => {
    const onClose = vi.fn();
    render(
      <Modal title="t" onClose={onClose} cancelLabel="Volver">
        <span>x</span>
      </Modal>,
    );
    // The default footer label "Cancelar" is replaced by the custom one.
    expect(screen.queryByText('Cancelar')).toBeNull();
    const cancelBtn = screen.getByText('Volver');
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('invokes onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(
      <Modal title="t" onClose={onClose}>
        <span>x</span>
      </Modal>,
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not invoke onClose for non-Escape keys', () => {
    const onClose = vi.fn();
    render(
      <Modal title="t" onClose={onClose}>
        <span>x</span>
      </Modal>,
    );
    fireEvent.keyDown(window, { key: 'Enter' });
    fireEvent.keyDown(window, { key: 'a' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('invokes onClose on a pointerdown outside the dialog (backdrop)', () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal title="t" onClose={onClose}>
        <span>x</span>
      </Modal>,
    );
    const backdrop = container.querySelector('[role="presentation"]') as HTMLElement;
    expect(backdrop).toBeTruthy();
    fireEvent.pointerDown(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT invoke onClose on a pointerdown inside the dialog', () => {
    const onClose = vi.fn();
    render(
      <Modal title="t" onClose={onClose}>
        <span>inside-content</span>
      </Modal>,
    );
    fireEvent.pointerDown(screen.getByText('inside-content'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders no confirm button when onConfirm is omitted', () => {
    render(
      <Modal title="t" onClose={() => {}}>
        <span>x</span>
      </Modal>,
    );
    expect(screen.queryByText('Confirmar')).toBeNull();
  });

  it('renders a confirm button defaulting to "Confirmar" when onConfirm is given', () => {
    const onConfirm = vi.fn();
    render(
      <Modal title="t" onClose={() => {}} onConfirm={onConfirm}>
        <span>x</span>
      </Modal>,
    );
    expect(screen.getByText('Confirmar')).toBeTruthy();
  });

  it('uses a custom confirmLabel when provided', () => {
    render(
      <Modal title="t" onClose={() => {}} onConfirm={() => {}} confirmLabel="Guardar">
        <span>x</span>
      </Modal>,
    );
    expect(screen.getByText('Guardar')).toBeTruthy();
    expect(screen.queryByText('Confirmar')).toBeNull();
  });

  it('calls onConfirm THEN onClose when confirm button is clicked', () => {
    const calls: string[] = [];
    const onConfirm = vi.fn(() => calls.push('confirm'));
    const onClose = vi.fn(() => calls.push('close'));
    render(
      <Modal title="t" onClose={onClose} onConfirm={onConfirm} confirmLabel="OK">
        <span>x</span>
      </Modal>,
    );
    fireEvent.click(screen.getByText('OK'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(calls).toEqual(['confirm', 'close']);
  });

  it('applies destructive styling to the confirm button when destructive is true', () => {
    render(
      <Modal title="t" onClose={() => {}} onConfirm={() => {}} confirmLabel="Delete" destructive>
        <span>x</span>
      </Modal>,
    );
    const btn = screen.getByText('Delete');
    expect(btn.className).toContain('rgb(220_38_38');
  });

  it('does not apply destructive styling by default', () => {
    render(
      <Modal title="t" onClose={() => {}} onConfirm={() => {}} confirmLabel="Save">
        <span>x</span>
      </Modal>,
    );
    const btn = screen.getByText('Save');
    expect(btn.className).toContain('var(--color-highlight-bg)');
    expect(btn.className).not.toContain('bg-[rgb(220_38_38/0.1)]');
  });

  it('removes the window listeners on unmount so later Escape does nothing', () => {
    const onClose = vi.fn();
    const { unmount } = render(
      <Modal title="t" onClose={onClose}>
        <span>x</span>
      </Modal>,
    );
    unmount();
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.pointerDown(window);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('always uses the latest onClose via the stable ref', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(
      <Modal title="t" onClose={first}>
        <span>x</span>
      </Modal>,
    );
    rerender(
      <Modal title="t" onClose={second}>
        <span>x</span>
      </Modal>,
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
