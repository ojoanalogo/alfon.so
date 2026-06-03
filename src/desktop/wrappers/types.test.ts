import { describe, it, expect, vi } from 'vitest';
import { appLabel, resolveAppTitle } from './types';
import type { AppContext, AppDefinition } from './types';

const ctx = { posts: [] } as unknown as AppContext;

function makeApp(overrides: Partial<AppDefinition> = {}): AppDefinition {
  return {
    id: 'app',
    title: 'app',
    geometry: {} as AppDefinition['geometry'],
    render: () => null,
    ...overrides,
  };
}

describe('appLabel', () => {
  it('returns the static string title verbatim', () => {
    expect(appLabel(makeApp({ id: 'settings', title: 'ajustes' }))).toBe('ajustes');
  });

  it('falls back to the id when the title is a function', () => {
    expect(appLabel(makeApp({ id: 'settings', title: () => 'ajustes' }))).toBe('settings');
  });
});

describe('resolveAppTitle', () => {
  it('formats a static string title', () => {
    expect(resolveAppTitle({ title: 'ajustes' }, ctx)).toBe('Ajustes');
  });

  it('invokes a function title with the context and formats its result', () => {
    const title = vi.fn((_ctx: AppContext) => 'ajustes');
    expect(resolveAppTitle({ title }, ctx)).toBe('Ajustes');
    expect(title).toHaveBeenCalledTimes(1);
    expect(title).toHaveBeenCalledWith(ctx);
  });

  it('passes through the raw result of a function title before formatting', () => {
    expect(resolveAppTitle({ title: () => 'hola mundo' }, ctx)).toBe('Hola mundo');
  });
});
