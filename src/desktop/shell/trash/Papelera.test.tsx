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
  trash: '/icons/trash.svg',
  'trash-full': '/icons/trash-full.svg',
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

  it('shows the empty trash icon when there are no trashed items', () => {
    const { container } = setup({ trashedCount: 0 });
    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    expect(img?.getAttribute('src')).toBe('/icons/trash.svg');
  });

  it('shows the full trash icon when there is at least one trashed item', () => {
    const { container } = setup({ trashedCount: 1 });
    const img = container.querySelector('img');
    expect(img?.getAttribute('src')).toBe('/icons/trash-full.svg');
  });

  it('keeps showing the full icon for larger trashed counts', () => {
    const { container } = setup({ trashedCount: 5 });
    const img = container.querySelector('img');
    expect(img?.getAttribute('src')).toBe('/icons/trash-full.svg');
  });

  it('resolves icon urls through the provided iconUrls map', () => {
    const { container } = setup({
      trashedCount: 1,
      iconUrls: { trash: '/a.svg', 'trash-full': '/custom-full.svg' },
    });
    const img = container.querySelector('img');
    expect(img?.getAttribute('src')).toBe('/custom-full.svg');
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
