import type { ReactNode } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { makeAppContext, makeWindowChromeProps, makeWindowState } from '@test/factories';
import { gameApp } from './gameApp';
import type { AppGeometry } from '../../types';

const GEOMETRY: AppGeometry = {
  defaultX: 0,
  defaultY: 0,
  defaultWidth: 600,
  defaultHeight: 400,
  minWidth: 400,
  initialZ: 10,
};

function makeGame(body: (props: { active: boolean }) => ReactNode) {
  return gameApp({
    id: 'snake',
    title: 'snake',
    geometry: GEOMETRY,
    body,
  });
}

/** A focused/open/non-minimized window => the game is "active". */
function activeWin() {
  return makeWindowChromeProps({
    focused: true,
    state: makeWindowState({ open: true, minimized: false }),
  });
}

describe('gameApp', () => {
  it('returns an AppDefinition preserving the metadata', () => {
    const app = makeGame(() => <p>game</p>);

    expect(app.id).toBe('snake');
    expect(app.title).toBe('snake');
    expect(app.geometry).toBe(GEOMETRY);
    expect(typeof app.render).toBe('function');
  });

  it('does not leak the body callback onto the definition object', () => {
    const app = makeGame(() => <p>game</p>);
    expect('body' in app).toBe(false);
  });

  it('render() mounts the game body inside the shared Window shell', () => {
    const app = makeGame(() => <canvas data-testid="game-canvas" />);

    const { container } = render(app.render(makeAppContext(), activeWin()));

    // The body is mounted...
    expect(container.querySelector('canvas')).toBeTruthy();
    // ...and wrapped by the standard desktop window chrome (title shown).
    expect(container.textContent).toContain('Snake');
  });

  it('passes active=true when the window is focused, open and not minimized', () => {
    let received: boolean | undefined;
    const app = makeGame(({ active }) => {
      received = active;
      return <p>{active ? 'running' : 'paused'}</p>;
    });

    render(app.render(makeAppContext(), activeWin()));

    expect(received).toBe(true);
    expect(screen.getByText('running')).toBeTruthy();
  });

  it('passes active=false when the window is not focused', () => {
    let received: boolean | undefined;
    const app = makeGame(({ active }) => {
      received = active;
      return <p>{active ? 'running' : 'paused'}</p>;
    });

    render(
      app.render(
        makeAppContext(),
        makeWindowChromeProps({ focused: false, state: makeWindowState({ open: true }) }),
      ),
    );

    expect(received).toBe(false);
    expect(screen.getByText('paused')).toBeTruthy();
  });

  it('passes active=false when the window is minimized (even if focused/open)', () => {
    let received: boolean | undefined;
    const app = makeGame(({ active }) => {
      received = active;
      return <p>body</p>;
    });

    render(
      app.render(
        makeAppContext(),
        makeWindowChromeProps({
          focused: true,
          state: makeWindowState({ open: true, minimized: true }),
        }),
      ),
    );

    expect(received).toBe(false);
  });

  it('passes active=false when the window is closed (open=false)', () => {
    let received: boolean | undefined;
    const app = makeGame(({ active }) => {
      received = active;
      return <p>body</p>;
    });

    render(
      app.render(
        makeAppContext(),
        makeWindowChromeProps({
          focused: true,
          state: makeWindowState({ open: false, minimized: false }),
        }),
      ),
    );

    expect(received).toBe(false);
  });

  it('re-evaluates the active flag on re-render when focus changes', () => {
    const seen: boolean[] = [];
    const app = makeGame(({ active }) => {
      seen.push(active);
      return <p>{active ? 'running' : 'paused'}</p>;
    });
    const ctx = makeAppContext();

    const { rerender } = render(app.render(ctx, activeWin()));
    expect(seen.at(-1)).toBe(true);

    rerender(
      app.render(
        ctx,
        makeWindowChromeProps({ focused: false, state: makeWindowState({ open: true }) }),
      ),
    );
    expect(seen.at(-1)).toBe(false);
    expect(screen.getByText('paused')).toBeTruthy();
  });
});
