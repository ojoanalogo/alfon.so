import { describe, it, expect, beforeEach } from 'vitest';
import { SOCIAL_LINKS } from '@/config';
import { makeBlogPost } from '@test/factories';
import { desktopAppLabel, desktopAppLabels, desktopVisibleApps } from '../appIcons';
import { APPS } from '../registry';
import { saveNotes } from '../notes/storage';
import type { Note } from '../notes/types';
import {
  runTerminalCommand,
  type TerminalCommandContext,
  type TerminalCommandResult,
} from './commands';

function ctx(overrides: Partial<TerminalCommandContext> = {}): TerminalCommandContext {
  return { posts: [], theme: 'dark', ...overrides };
}

/** Narrow a result to the block list (asserting it's not a clear/null result). */
function blocks(result: TerminalCommandResult) {
  if (!result || 'clear' in result) {
    throw new Error('expected blocks result');
  }
  return result.blocks;
}

function outputLines(result: TerminalCommandResult): string[] {
  const b = blocks(result);
  const out = b.find((block) => block.kind === 'output');
  if (!out || out.kind !== 'output') throw new Error('no output block');
  return out.lines;
}

describe('runTerminalCommand', () => {
  it('returns null for empty input', () => {
    expect(runTerminalCommand('', ctx())).toBeNull();
    expect(runTerminalCommand('   ', ctx())).toBeNull();
    expect(runTerminalCommand('\t\n', ctx())).toBeNull();
  });

  it('echoes the trimmed command as the first block', () => {
    const result = runTerminalCommand('  help  ', ctx());
    const b = blocks(result);
    expect(b[0]).toEqual({ kind: 'command', text: 'help' });
  });

  it('help lists available commands', () => {
    const lines = outputLines(runTerminalCommand('help', ctx()));
    expect(lines[0]).toBe('Comandos disponibles:');
    expect(lines.some((l) => l.includes('about'))).toBe(true);
    expect(lines.some((l) => l.includes('neofetch'))).toBe(true);
    expect(lines.some((l) => l.includes('clear'))).toBe(true);
    expect(lines.some((l) => l.includes('whoami'))).toBe(true);
  });

  it('about prints the site info', () => {
    const lines = outputLines(runTerminalCommand('about', ctx()));
    expect(lines[0]).toBe('alfon.so — portafolio personal');
    expect(lines.some((l) => l.includes('hola@alfon.so'))).toBe(true);
  });

  it('social lists each configured social link with platform and url', () => {
    const lines = outputLines(runTerminalCommand('social', ctx()));
    expect(lines.length).toBe(SOCIAL_LINKS.length);
    for (const [i, link] of SOCIAL_LINKS.entries()) {
      expect(lines[i]).toContain(link.platform);
      expect(lines[i]).toContain(link.url);
    }
  });

  it('ls shows desktop, notes, and trash sections', () => {
    const lines = outputLines(runTerminalCommand('ls', ctx()));
    expect(lines).toContain('Escritorio:');
    expect(lines).toContain('~/notes:');
    expect(lines).toContain('Papelera:');
    // node_modules is a known trash entry
    expect(lines.some((l) => l.includes('node_modules'))).toBe(true);
  });

  describe('notes sync', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('lists saved notes under ~/notes in ls', () => {
      const notes: Note[] = [
        {
          id: 'n1',
          title: 'Lista de compras',
          content: 'leche',
          updatedAt: '2026-06-02T00:00:00.000Z',
        },
      ];
      saveNotes(notes);
      const lines = outputLines(runTerminalCommand('ls', ctx()));
      expect(lines.some((l) => l.includes('lista-de-compras.md'))).toBe(true);
    });

    it('cat notes/foo.md previews content and requests opening the note', () => {
      const notes: Note[] = [
        {
          id: 'note-1',
          title: 'Ideas',
          content: 'hacer minesweeper',
          updatedAt: '2026-06-02T00:00:00.000Z',
        },
      ];
      saveNotes(notes);
      const result = runTerminalCommand('cat notes/ideas.md', ctx());
      const b = blocks(result);
      const out = b.find((block) => block.kind === 'output');
      expect(out && out.kind === 'output' && out.lines.some((l) => l.includes('hacer minesweeper'))).toBe(
        true,
      );
      expect(result && 'action' in result && result.action).toEqual({
        type: 'openNote',
        noteId: 'note-1',
      });
    });
  });

  it('cat about reads a known desktop file', () => {
    const lines = outputLines(runTerminalCommand('cat about', ctx()));
    expect(lines.some((l) => l.includes('alfonso reyes'))).toBe(true);
    expect(lines.some((l) => l.includes('hola@alfon.so'))).toBe(true);
  });

  it('cat strips ~/Desktop/ and ~/ path prefixes', () => {
    const a = outputLines(runTerminalCommand('cat ~/Desktop/about', ctx()));
    const b = outputLines(runTerminalCommand('cat ~/about', ctx()));
    expect(a.some((l) => l.includes('alfonso reyes'))).toBe(true);
    expect(b.some((l) => l.includes('alfonso reyes'))).toBe(true);
  });

  it('cat blog lists posts from ctx and a row count', () => {
    const posts = [
      makeBlogPost({ title: 'First Post' }),
      makeBlogPost({ title: "O'Brien's Notes" }),
    ];
    const lines = outputLines(runTerminalCommand('cat blog', ctx({ posts })));
    expect(lines[0]).toBe('-- SELECT title FROM blog ORDER BY publish_date DESC;');
    expect(lines).toContain("  'First Post',");
    // single quotes are SQL-escaped by doubling
    expect(lines).toContain("  'O''Brien''s Notes',");
    expect(lines).toContain('-- 2 row(s)');
  });

  it('cat blog is unavailable when there are no posts', () => {
    const lines = outputLines(runTerminalCommand('cat blog', ctx({ posts: [] })));
    expect(lines[0]).toBe('cat: blog: no such file');
  });

  it('cat projects lists project entries', () => {
    const lines = outputLines(runTerminalCommand('cat projects', ctx()));
    expect(lines.some((l) => l.startsWith('drwxr-xr-x'))).toBe(true);
  });

  it('cat no_abrir.mp4 reads trash-only junk', () => {
    const lines = outputLines(runTerminalCommand('cat no_abrir.mp4', ctx()));
    expect(lines.some((l) => l.includes('NO lo abrieras'))).toBe(true);
  });

  it('ls omits blog when there are no posts', () => {
    const lines = outputLines(runTerminalCommand('ls', ctx({ posts: [] })));
    const desktopRow = lines.find((l) => l.includes('blog'));
    expect(desktopRow).toBeUndefined();
  });

  it('ls desktop order matches DESKTOP_ICON_ORDER', () => {
    const posts = [makeBlogPost()];
    const lines = outputLines(runTerminalCommand('ls', ctx({ posts })));
    const escIdx = lines.indexOf('Escritorio:');
    const notesIdx = lines.indexOf('~/notes:');
    const desktopSection = lines.slice(escIdx + 1, notesIdx - 1).filter((l) => l.trim().length > 0);
    const namesInLs = desktopSection.join('   ').split(/\s{3,}/).map((s) => s.trim()).filter(Boolean);
    expect(namesInLs).toEqual(desktopAppLabels(APPS, { posts }));
  });

  it('cat reaches every visible desktop app via its ls label', () => {
    const posts = [makeBlogPost()];
    const visible = desktopVisibleApps(APPS, { posts });
    for (const app of visible) {
      const label = desktopAppLabel(app);
      const lines = outputLines(runTerminalCommand(`cat ${label}`, ctx({ posts })));
      expect(lines.length).toBeGreaterThan(0);
      expect(lines.some((l) => l.includes('no such file'))).toBe(false);
    }
  });

  it('cat contacto, cv, settings, games, notes, and terminal', () => {
    expect(outputLines(runTerminalCommand('cat contacto', ctx())).some((l) => l.includes('hola@alfon.so'))).toBe(
      true,
    );
    expect(outputLines(runTerminalCommand('cat cv', ctx())).some((l) => l.includes('currículum'))).toBe(true);
    expect(outputLines(runTerminalCommand('cat settings', ctx())).some((l) => l.includes('ajustes'))).toBe(true);
    expect(outputLines(runTerminalCommand('cat games', ctx())).some((l) => l.includes('minesweeper'))).toBe(true);
    expect(outputLines(runTerminalCommand('cat notes', ctx())).some((l) => l.includes('~/notes'))).toBe(true);
    expect(outputLines(runTerminalCommand('cat terminal', ctx())).some((l) => l.includes('help'))).toBe(true);
  });

  it('cat with no argument prompts for a file', () => {
    const lines = outputLines(runTerminalCommand('cat', ctx()));
    expect(lines).toContain('cat: falta archivo');
    expect(lines.some((l) => l.includes('cat about'))).toBe(true);
  });

  it('cat on a missing file returns a no-such-file error', () => {
    const lines = outputLines(runTerminalCommand('cat nope.txt', ctx()));
    expect(lines[0]).toBe('cat: nope.txt: no such file');
    expect(lines.some((l) => l.includes('ls'))).toBe(true);
  });

  it('neofetch includes the theme from ctx', () => {
    const lines = outputLines(runTerminalCommand('neofetch', ctx({ theme: 'light' })));
    expect(lines.some((l) => l.includes('Theme: light'))).toBe(true);
    expect(lines.some((l) => l.includes('guest@alfon.so'))).toBe(true);
  });

  it('fetch is an alias of neofetch and reflects the theme', () => {
    const dark = outputLines(runTerminalCommand('fetch', ctx({ theme: 'dark' })));
    expect(dark.some((l) => l.includes('Theme: dark'))).toBe(true);
    // same shape as neofetch
    const neo = outputLines(runTerminalCommand('neofetch', ctx({ theme: 'dark' })));
    expect(dark).toEqual(neo);
  });

  it('clear returns a clear result with no blocks', () => {
    const result = runTerminalCommand('clear', ctx());
    expect(result).toEqual({ clear: true });
  });

  it('whoami returns guest', () => {
    const lines = outputLines(runTerminalCommand('whoami', ctx()));
    expect(lines).toEqual(['guest']);
  });

  it('is case-insensitive for the command name', () => {
    const lines = outputLines(runTerminalCommand('HELP', ctx()));
    expect(lines[0]).toBe('Comandos disponibles:');
  });

  it('unknown command returns command-not-found using lowercased name', () => {
    const lines = outputLines(runTerminalCommand('FooBar', ctx()));
    expect(lines[0]).toBe('foobar: command not found');
    expect(lines.some((l) => l.includes('help'))).toBe(true);
  });
});
