import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import snakeApp from './index';
import { makeAppContext, makeWindowChromeProps, makeWindowState } from '@test/factories';

// Characterization for the lazy game boundary: the canvas/shell must still
// render once the window is open (eager now, after Suspense once code-split).
describe('snake app definition', () => {
  it('renders the game body once the window is open', async () => {
    const win = makeWindowChromeProps({ state: makeWindowState({ id: 'snake', open: true }) });
    render(snakeApp.render(makeAppContext(), win));
    expect(await screen.findByText(/flechas/i)).toBeTruthy();
  });

  it('does not render the game while the window has never been opened', () => {
    const win = makeWindowChromeProps({ state: makeWindowState({ id: 'snake', open: false }) });
    render(snakeApp.render(makeAppContext(), win));
    expect(screen.queryByText(/flechas/i)).toBeNull();
  });
});
