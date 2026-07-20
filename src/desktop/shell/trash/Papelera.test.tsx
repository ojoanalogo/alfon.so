import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Control the resolved icon-label tone deterministically so the wrapper class
// can be asserted without standing up the full WallpaperProvider luminance flow.
const toneMock = vi.fn<() => 'light' | 'dark'>(() => 'dark');
vi.mock('../../lib/useResolvedIconLabelTone', () => ({
  useResolvedIconLabelTone: () => toneMock(),
}));

import Papelera from './Papelera';

const ICON_URLS = {
  trash: '/icons/trash.png',
};

function setup(overrides: Partial<Parameters<typeof Papelera>[0]> = {}) {
  const onOpen = vi.fn();
  const trashRef = createRef<HTMLButtonElement>();
  const suppressNextClickRef = { current: false };
  const props = {
    trashedCount: 0,
    iconUrls: ICON_URLS,
    onOpen,
    trashRef,
    suppressNextClickRef,
    ...overrides,
  };
  const utils = render(<Papelera {...props} />);
  return { onOpen, trashRef, suppressNextClickRef, ...utils };
}

beforeEach(() => {
  toneMock.mockReset();
  toneMock.mockReturnValue('dark');
});

describe('Papelera', () => {
  it('renders the trash trigger button with its accessible label', () => {
    setup();
    const button = screen.getByRole('button', { name: 'Papelera' });
    expect(button).toBeTruthy();
    expect(button.getAttribute('type')).toBe('button');
    // Visible label text is also present.
    expect(screen.getByText('Papelera')).toBeTruthy();
  });

  it('always shows the trash icon regardless of trashed count', () => {
    const empty = setup({ trashedCount: 0 });
    expect(empty.container.querySelector('img')?.getAttribute('src')).toBe('/icons/trash.png');
    empty.unmount();

    const full = setup({ trashedCount: 5 });
    expect(full.container.querySelector('img')?.getAttribute('src')).toBe('/icons/trash.png');
  });

  it('resolves icon urls through the provided iconUrls map', () => {
    const { container } = setup({
      trashedCount: 1,
      iconUrls: { trash: '/custom-trash.png' },
    });
    const img = container.querySelector('img');
    expect(img?.getAttribute('src')).toBe('/custom-trash.png');
  });

  it('invokes onOpen when the trigger is clicked', () => {
    const { onOpen } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Papelera' }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('swallows a single click when suppressNextClickRef is set and resets the flag', () => {
    const { onOpen, suppressNextClickRef } = setup();
    suppressNextClickRef.current = true;

    fireEvent.click(screen.getByRole('button', { name: 'Papelera' }));
    expect(onOpen).not.toHaveBeenCalled();
    // The suppression flag is consumed.
    expect(suppressNextClickRef.current).toBe(false);

    // A subsequent click goes through normally.
    fireEvent.click(screen.getByRole('button', { name: 'Papelera' }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('forwards the button ref so callers can measure/position the trigger', () => {
    const { trashRef } = setup();
    expect(trashRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(trashRef.current?.getAttribute('aria-label')).toBe('Papelera');
  });

  it('applies the dark label-tone class on the wrapper', () => {
    toneMock.mockReturnValue('dark');
    const { container } = setup();
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain('papelera--labels-dark');
    expect(wrapper.className).not.toContain('papelera--labels-light');
  });

  it('applies the light label-tone class on the wrapper', () => {
    toneMock.mockReturnValue('light');
    const { container } = setup();
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain('papelera--labels-light');
    expect(wrapper.className).not.toContain('papelera--labels-dark');
  });

  it('marks the icon image as decorative (empty alt, aria-hidden span)', () => {
    const { container } = setup();
    const img = container.querySelector('img');
    expect(img?.getAttribute('alt')).toBe('');
    const span = img?.closest('span');
    expect(span?.getAttribute('aria-hidden')).toBe('true');
  });
});
