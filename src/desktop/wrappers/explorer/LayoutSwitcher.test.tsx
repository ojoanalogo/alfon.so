import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import LayoutSwitcher from './LayoutSwitcher';
import type { ExplorerViewMode } from './types';

describe('LayoutSwitcher', () => {
  it('renders a grid and a list toggle button inside a labelled toolbar', () => {
    render(<LayoutSwitcher mode="grid" onChange={vi.fn()} />);
    expect(screen.getByRole('toolbar', { name: 'Cambiar vista' })).toBeTruthy();
    expect(screen.getByTitle('Vista de iconos')).toBeTruthy();
    expect(screen.getByTitle('Vista de lista')).toBeTruthy();
  });

  it('marks the grid button pressed when mode is grid', () => {
    render(<LayoutSwitcher mode="grid" onChange={vi.fn()} />);
    expect(screen.getByTitle('Vista de iconos').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTitle('Vista de lista').getAttribute('aria-pressed')).toBe('false');
  });

  it('marks the list button pressed when mode is list', () => {
    render(<LayoutSwitcher mode="list" onChange={vi.fn()} />);
    expect(screen.getByTitle('Vista de lista').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTitle('Vista de iconos').getAttribute('aria-pressed')).toBe('false');
  });

  it('calls onChange("list") when the list button is clicked', () => {
    const onChange = vi.fn();
    render(<LayoutSwitcher mode="grid" onChange={onChange} />);
    fireEvent.click(screen.getByTitle('Vista de lista'));
    expect(onChange).toHaveBeenCalledWith('list');
  });

  it('calls onChange("grid") when the grid button is clicked', () => {
    const onChange = vi.fn();
    render(<LayoutSwitcher mode="list" onChange={onChange} />);
    fireEvent.click(screen.getByTitle('Vista de iconos'));
    expect(onChange).toHaveBeenCalledWith('grid');
  });

  it('stops pointerdown propagation so dragging the window does not start', () => {
    const onParentPointerDown = vi.fn();
    render(
      <div onPointerDown={onParentPointerDown}>
        <LayoutSwitcher mode="grid" onChange={vi.fn()} />
      </div>,
    );
    fireEvent.pointerDown(screen.getByTitle('Vista de lista'));
    expect(onParentPointerDown).not.toHaveBeenCalled();
  });

  it('toggles the active view when driven by a controlled callback', () => {
    function Harness() {
      const [mode, setMode] = useState<ExplorerViewMode>('grid');
      return <LayoutSwitcher mode={mode} onChange={setMode} />;
    }
    render(<Harness />);

    const listBtn = screen.getByTitle('Vista de lista');
    expect(listBtn.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(listBtn);
    expect(screen.getByTitle('Vista de lista').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTitle('Vista de iconos').getAttribute('aria-pressed')).toBe('false');
  });
});
