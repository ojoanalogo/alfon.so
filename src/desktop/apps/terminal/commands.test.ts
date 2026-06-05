import { describe, it, expect } from 'vitest';
import { SOCIAL_LINKS } from '@/config';
import { makeBlogPost } from '@test/factories';
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

  it('ls shows desktop and trash sections', () => {
    const lines = outputLines(runTerminalCommand('ls', ctx()));
    expect(lines).toContain('Escritorio:');
    expect(lines).toContain('Papelera:');
    // node_modules is a known trash entry
    expect(lines.some((l) => l.includes('node_modules'))).toBe(true);
  });

  it('cat about.txt reads a known file', () => {
    const lines = outputLines(runTerminalCommand('cat about.txt', ctx()));
    expect(lines.some((l) => l.includes('alfonso reyes'))).toBe(true);
    expect(lines.some((l) => l.includes('hola@alfon.so'))).toBe(true);
  });

  it('cat strips ~/Desktop/ and ~/ path prefixes', () => {
    const a = outputLines(runTerminalCommand('cat ~/Desktop/about.txt', ctx()));
    const b = outputLines(runTerminalCommand('cat ~/about.txt', ctx()));
    expect(a.some((l) => l.includes('alfonso reyes'))).toBe(true);
    expect(b.some((l) => l.includes('alfonso reyes'))).toBe(true);
  });

  it('cat blog.sql lists posts from ctx and a row count', () => {
    const posts = [
      makeBlogPost({ title: 'First Post' }),
      makeBlogPost({ title: "O'Brien's Notes" }),
    ];
    const lines = outputLines(runTerminalCommand('cat blog.sql', ctx({ posts })));
    expect(lines[0]).toBe('-- SELECT title FROM blog ORDER BY publish_date DESC;');
    expect(lines).toContain("  'First Post',");
    // single quotes are SQL-escaped by doubling
    expect(lines).toContain("  'O''Brien''s Notes',");
    expect(lines).toContain('-- 2 row(s)');
  });

  it('cat blog.sql shows (empty) when there are no posts', () => {
    const lines = outputLines(runTerminalCommand('cat blog.sql', ctx({ posts: [] })));
    expect(lines).toContain('-- (empty)');
    expect(lines.some((l) => l.includes('row(s)'))).toBe(false);
  });

  it('cat with no argument prompts for a file', () => {
    const lines = outputLines(runTerminalCommand('cat', ctx()));
    expect(lines).toContain('cat: falta archivo');
    expect(lines.some((l) => l.includes('cat about.txt'))).toBe(true);
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
