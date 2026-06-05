import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { makeBlogPost } from '@test/factories';
import { stubMatchMedia } from '@test/helpers';
import TerminalApp from './TerminalApp';
import { ThemeProvider } from '../../state/ThemeContext';
import { TERMINAL_PROMPT } from './commands';
import type { BlogPostSummary } from '../../types';

function renderTerminal(props?: { posts?: BlogPostSummary[]; focused?: boolean }) {
  const result = render(
    <ThemeProvider>
      <TerminalApp posts={props?.posts ?? []} focused={props?.focused} />
    </ThemeProvider>,
  );
  return result;
}

function getInput(): HTMLInputElement {
  return screen.getByLabelText('Comando de terminal') as HTMLInputElement;
}

function typeCommand(value: string) {
  const input = getInput();
  fireEvent.change(input, { target: { value } });
}

function submit() {
  // The input lives inside a <form>; submitting the form runs the command.
  const form = getInput().closest('form');
  if (!form) throw new Error('terminal form not found');
  fireEvent.submit(form);
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = '';
  delete document.documentElement.dataset.themePreference;
  // jsdom has no matchMedia; ThemeProvider/useTheme reads it via the theme runtime.
  stubMatchMedia();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('TerminalApp', () => {
  it('renders the MOTD and a prompt on mount with no output blocks', () => {
    const { container } = renderTerminal();

    // MOTD line is present.
    expect(screen.getByText('escribe "help" para ver los comandos disponibles.')).toBeTruthy();
    // Prompt label rendered (label + any command lines share the prompt text).
    expect(screen.getAllByText(TERMINAL_PROMPT).length).toBeGreaterThanOrEqual(1);
    // Input starts empty.
    expect(getInput().value).toBe('');
    // The terminal region wrapper exists.
    expect(container.querySelector('[aria-label="Terminal"]')).toBeTruthy();
  });

  it('runs "help" on submit and shows the help output', () => {
    renderTerminal();

    typeCommand('help');
    submit();

    expect(screen.getByText('Comandos disponibles:')).toBeTruthy();
    // A representative help line.
    expect(screen.getByText(/about\s+info del sitio/)).toBeTruthy();
    // The echoed command line appears too.
    const helpEchoes = screen.getAllByText('help');
    expect(helpEchoes.length).toBeGreaterThanOrEqual(1);
    // Input is cleared after submit.
    expect(getInput().value).toBe('');
  });

  it('runs "about" on submit and shows the about output', () => {
    renderTerminal();

    typeCommand('about');
    submit();

    expect(screen.getByText('alfon.so — portafolio personal')).toBeTruthy();
    expect(screen.getByText('email: hola@alfon.so')).toBeTruthy();
  });

  it('echoes the typed command as a command line in the scrollback', () => {
    renderTerminal();

    typeCommand('about');
    submit();

    // The echoed command text "about" should now appear in the output.
    expect(screen.getByText('about')).toBeTruthy();
  });

  it('shows a "command not found" message for unknown commands', () => {
    renderTerminal();

    typeCommand('nope');
    submit();

    expect(screen.getByText('nope: command not found')).toBeTruthy();
    expect(screen.getByText('escribe "help" para ver comandos')).toBeTruthy();
  });

  it('ignores empty / whitespace-only submissions', () => {
    renderTerminal();

    typeCommand('   ');
    submit();

    // No command-not-found, no extra output beyond MOTD.
    expect(screen.queryByText(/command not found/)).toBeNull();
    // Input stays as-is (submitCommand returns early without clearing).
    expect(getInput().value).toBe('   ');
  });

  it('"clear" empties previously rendered output', () => {
    renderTerminal();

    typeCommand('about');
    submit();
    expect(screen.getByText('alfon.so — portafolio personal')).toBeTruthy();

    typeCommand('clear');
    submit();

    // Prior output is gone.
    expect(screen.queryByText('alfon.so — portafolio personal')).toBeNull();
    // MOTD remains (it is static, outside the blocks list).
    expect(screen.getByText('escribe "help" para ver los comandos disponibles.')).toBeTruthy();
  });

  it('cat blog.sql renders post titles from the posts prop', () => {
    renderTerminal({ posts: [makeBlogPost({ title: 'My First Post' })] });

    typeCommand('cat blog.sql');
    submit();

    // Leading whitespace is normalized away by default; match the inner text.
    expect(screen.getByText("'My First Post',")).toBeTruthy();
    expect(screen.getByText('-- 1 row(s)')).toBeTruthy();
  });

  it('neofetch includes the resolved theme from ThemeProvider', () => {
    renderTerminal();

    typeCommand('neofetch');
    submit();

    // matchMedia stub returns no dark match, so the effective theme is "light".
    // getByText normalizes the inner whitespace runs to single spaces.
    expect(screen.getByText('████▀ ▀████ Theme: light')).toBeTruthy();
  });

  describe('history navigation', () => {
    it('ArrowUp recalls the most recent command', () => {
      renderTerminal();

      typeCommand('help');
      submit();
      typeCommand('about');
      submit();

      const input = getInput();
      expect(input.value).toBe('');

      fireEvent.keyDown(input, { key: 'ArrowUp' });
      expect(getInput().value).toBe('about');

      fireEvent.keyDown(input, { key: 'ArrowUp' });
      expect(getInput().value).toBe('help');

      // Cannot go past the oldest entry.
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      expect(getInput().value).toBe('help');
    });

    it('ArrowDown walks forward and clears the draft past the newest entry', () => {
      renderTerminal();

      typeCommand('help');
      submit();
      typeCommand('about');
      submit();

      const input = getInput();
      // Go back two entries.
      fireEvent.keyDown(input, { key: 'ArrowUp' }); // about
      fireEvent.keyDown(input, { key: 'ArrowUp' }); // help
      expect(getInput().value).toBe('help');

      fireEvent.keyDown(input, { key: 'ArrowDown' }); // about
      expect(getInput().value).toBe('about');

      fireEvent.keyDown(input, { key: 'ArrowDown' }); // past newest -> cleared
      expect(getInput().value).toBe('');
    });

    it('ArrowDown does nothing when no history navigation is active', () => {
      renderTerminal();

      typeCommand('typed but not submitted');
      const input = getInput();
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      // Draft is untouched because historyIndex is -1.
      expect(getInput().value).toBe('typed but not submitted');
    });

    it('ArrowUp with empty history does not change the draft', () => {
      renderTerminal();

      typeCommand('hello');
      const input = getInput();
      fireEvent.keyDown(input, { key: 'ArrowUp' });

      expect(getInput().value).toBe('hello');
    });
  });

  describe('focused prop', () => {
    it('focuses the input when focused is true', () => {
      renderTerminal({ focused: true });
      expect(document.activeElement).toBe(getInput());
    });

    it('does not focus the input when focused is false', () => {
      renderTerminal({ focused: false });
      expect(document.activeElement).not.toBe(getInput());
    });

    it('focuses the input on pointer down within the region', () => {
      const { container } = renderTerminal({ focused: false });
      const region = container.querySelector('[aria-label="Terminal"]') as HTMLElement;

      fireEvent.pointerDown(region);
      expect(document.activeElement).toBe(getInput());
    });
  });
});
