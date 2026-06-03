import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../../state/ThemeContext';
import terminalApp from './index';
import { makeAppContext, makeWindowChromeProps, makeWindowState } from '@test/factories';

// Characterization for the lazy app boundary: the body must still render its
// content once the window is open (synchronously when eager, after Suspense
// resolves when code-split).
describe('terminal app definition', () => {
  it('renders the terminal body once the window is open', async () => {
    const win = makeWindowChromeProps({ state: makeWindowState({ id: 'terminal', open: true }) });
    render(<ThemeProvider>{terminalApp.render(makeAppContext(), win)}</ThemeProvider>);
    expect(await screen.findByText(/escribe "help"/i)).toBeTruthy();
  });

  it('does not render the body while the window has never been opened', () => {
    const win = makeWindowChromeProps({ state: makeWindowState({ id: 'terminal', open: false }) });
    render(<ThemeProvider>{terminalApp.render(makeAppContext(), win)}</ThemeProvider>);
    expect(screen.queryByText(/escribe "help"/i)).toBeNull();
  });
});
