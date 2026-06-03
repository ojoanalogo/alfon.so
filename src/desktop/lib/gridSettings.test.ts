import { describe, it, expect } from 'vitest';
import {
  DEFAULT_GRID_SETTINGS,
  ICON_SIZE_PX,
  SPACING_GAP_PX,
  type GridSettings,
} from './gridSettings';

describe('DEFAULT_GRID_SETTINGS', () => {
  it('has the documented default values', () => {
    expect(DEFAULT_GRID_SETTINGS).toEqual({
      iconSize: 'medium',
      spacing: 'normal',
      sortBy: 'name',
    });
  });

  it('exposes exactly the three known keys', () => {
    expect(Object.keys(DEFAULT_GRID_SETTINGS).sort()).toEqual([
      'iconSize',
      'sortBy',
      'spacing',
    ]);
  });

  it('uses values that are valid keys of the lookup maps', () => {
    expect(ICON_SIZE_PX[DEFAULT_GRID_SETTINGS.iconSize]).toBeTypeOf('number');
    expect(SPACING_GAP_PX[DEFAULT_GRID_SETTINGS.spacing]).toBeTypeOf('number');
  });

  it('is structurally assignable to GridSettings', () => {
    const s: GridSettings = DEFAULT_GRID_SETTINGS;
    expect(s.sortBy).toBe('name');
  });
});

describe('ICON_SIZE_PX', () => {
  it('maps each icon size to its pixel value', () => {
    expect(ICON_SIZE_PX).toEqual({ small: 24, medium: 32, large: 48 });
  });

  it('is strictly monotonically increasing small < medium < large', () => {
    expect(ICON_SIZE_PX.small).toBeLessThan(ICON_SIZE_PX.medium);
    expect(ICON_SIZE_PX.medium).toBeLessThan(ICON_SIZE_PX.large);
  });

  it('has only positive integer values', () => {
    for (const v of Object.values(ICON_SIZE_PX)) {
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThan(0);
    }
  });
});

describe('SPACING_GAP_PX', () => {
  it('maps each spacing to its gap value', () => {
    expect(SPACING_GAP_PX).toEqual({ compact: 8, normal: 16, roomy: 24 });
  });

  it('is strictly monotonically increasing compact < normal < roomy', () => {
    expect(SPACING_GAP_PX.compact).toBeLessThan(SPACING_GAP_PX.normal);
    expect(SPACING_GAP_PX.normal).toBeLessThan(SPACING_GAP_PX.roomy);
  });

  it('has only positive integer values', () => {
    for (const v of Object.values(SPACING_GAP_PX)) {
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThan(0);
    }
  });
});
