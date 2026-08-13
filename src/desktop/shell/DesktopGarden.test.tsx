import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import DesktopGarden from './DesktopGarden';
import { GARDEN_MOTIF, GARDEN_REPEAT, gardenSprites } from './gardenSprites';

describe('gardenSprites', () => {
  it('repeats the motif to fill a wide desktop', () => {
    const sprites = gardenSprites();
    expect(sprites).toHaveLength(GARDEN_MOTIF.length * GARDEN_REPEAT);
    expect(sprites[0]).toEqual(GARDEN_MOTIF[0]);
    expect(sprites[GARDEN_MOTIF.length]).toEqual(GARDEN_MOTIF[0]);
  });
});

describe('DesktopGarden', () => {
  it('renders a decorative garden strip with pixel sprites', () => {
    const { container } = render(<DesktopGarden />);
    const garden = container.querySelector('[data-desktop-garden]');
    expect(garden).toBeTruthy();
    expect(garden?.className).toContain('pointer-events-none');

    const sprites = container.querySelectorAll('[data-garden-sprite]');
    expect(sprites.length).toBe(GARDEN_MOTIF.length * GARDEN_REPEAT);
    expect(sprites[0]?.getAttribute('alt')).toBe('');
  });
});
