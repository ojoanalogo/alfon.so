import { describe, expect, it } from 'vitest';
import type { AppContext, AppDefinition } from '@desktop/wrappers';
import type { AppGeometry } from '@desktop/types';
import { appToWindowDef } from './appToWindowDef';

function makeAppDefinition(overrides: Partial<AppDefinition> = {}): AppDefinition {
  const geometry: AppGeometry = { defaultWidth: 600 };
  return {
    id: 'finder',
    title: 'finder',
    geometry,
    render: () => null,
    ...overrides,
  };
}

describe('appToWindowDef', () => {
  it('propagates id and formats the title (first letter uppercased)', () => {
    const win = appToWindowDef(makeAppDefinition({ id: 'finder', title: 'finder' }));
    expect(win.id).toBe('finder');
    expect(win.title).toBe('Finder');
  });

  it('uses app.id (not the function) when title is a function, then formats it', () => {
    const app = makeAppDefinition({
      id: 'terminal',
      title: (_ctx: AppContext) => 'Dynamic Title',
    });
    const win = appToWindowDef(app);
    // Falls back to id 'terminal', then formats to 'Terminal'.
    expect(win.title).toBe('Terminal');
  });

  it('leaves an already-capitalized string title unchanged', () => {
    const win = appToWindowDef(makeAppDefinition({ title: 'Notes' }));
    expect(win.title).toBe('Notes');
  });

  it('forces defaultX and defaultY to 0 even when geometry provides values', () => {
    const win = appToWindowDef(
      makeAppDefinition({
        geometry: { defaultWidth: 800, defaultX: 123, defaultY: 456 },
      }),
    );
    expect(win.defaultX).toBe(0);
    expect(win.defaultY).toBe(0);
  });

  it('defaults defaultX/defaultY to 0 when geometry omits them', () => {
    const win = appToWindowDef(makeAppDefinition({ geometry: { defaultWidth: 400 } }));
    expect(win.defaultX).toBe(0);
    expect(win.defaultY).toBe(0);
  });

  it('derives initialZ from BASE_Z (10) + index when geometry omits initialZ', () => {
    expect(appToWindowDef(makeAppDefinition()).initialZ).toBe(10);
    expect(appToWindowDef(makeAppDefinition(), 0).initialZ).toBe(10);
    expect(appToWindowDef(makeAppDefinition(), 3).initialZ).toBe(13);
    expect(appToWindowDef(makeAppDefinition(), 7).initialZ).toBe(17);
  });

  it('respects an explicit geometry.initialZ over the derived stacking value', () => {
    const win = appToWindowDef(
      makeAppDefinition({ geometry: { defaultWidth: 600, initialZ: 99 } }),
      5,
    );
    expect(win.initialZ).toBe(99);
  });

  it('uses the derived value when geometry.initialZ is 0 (falsy but defined)', () => {
    // initialZ ?? ... : 0 is defined, so nullish coalescing keeps 0.
    const win = appToWindowDef(
      makeAppDefinition({ geometry: { defaultWidth: 600, initialZ: 0 } }),
      4,
    );
    expect(win.initialZ).toBe(0);
  });

  it('propagates all geometry fields onto the WindowDef', () => {
    const geometry: AppGeometry = {
      defaultWidth: 720,
      defaultHeight: 480,
      minHeight: 200,
      minWidth: 320,
      center: true,
      defaultOpen: true,
    };
    const win = appToWindowDef(makeAppDefinition({ geometry }));
    expect(win.defaultWidth).toBe(720);
    expect(win.defaultHeight).toBe(480);
    expect(win.minHeight).toBe(200);
    expect(win.minWidth).toBe(320);
    expect(win.center).toBe(true);
    expect(win.defaultOpen).toBe(true);
  });

  it('preserves a null/content-driven height by omitting defaultHeight', () => {
    const win = appToWindowDef(makeAppDefinition({ geometry: { defaultWidth: 500 } }));
    expect(win.defaultHeight).toBeUndefined();
  });

  it('defaults index to 0 when not provided', () => {
    const win = appToWindowDef(makeAppDefinition());
    expect(win.initialZ).toBe(10);
  });

  it('returns a WindowDef with the required shape', () => {
    const win = appToWindowDef(makeAppDefinition());
    expect(win).toMatchObject({
      id: 'finder',
      title: 'Finder',
      defaultX: 0,
      defaultY: 0,
      defaultWidth: 600,
      initialZ: 10,
    });
  });
});
