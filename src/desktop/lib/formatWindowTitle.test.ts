import { describe, it, expect } from 'vitest';
import { formatWindowTitle } from './formatWindowTitle';

describe('formatWindowTitle', () => {
  it('uppercases the first letter of a lowercase word', () => {
    expect(formatWindowTitle('hello')).toBe('Hello');
  });

  it('leaves the rest of the string unchanged', () => {
    expect(formatWindowTitle('hello world')).toBe('Hello world');
    expect(formatWindowTitle('hELLO')).toBe('HELLO');
  });

  it('is idempotent for already-capitalized input', () => {
    expect(formatWindowTitle('Hello')).toBe('Hello');
    expect(formatWindowTitle('World peace')).toBe('World peace');
  });

  it('returns empty string unchanged (falsy guard)', () => {
    expect(formatWindowTitle('')).toBe('');
  });

  it('skips leading non-letter characters and uppercases the first letter', () => {
    expect(formatWindowTitle('  hello')).toBe('  Hello');
    expect(formatWindowTitle('123abc')).toBe('123Abc');
    expect(formatWindowTitle('-config')).toBe('-Config');
    expect(formatWindowTitle('(notes)')).toBe('(Notes)');
  });

  it('only uppercases the first letter, not later ones', () => {
    expect(formatWindowTitle('1a2b')).toBe('1A2b');
  });

  it('returns the string unchanged when there are no letters', () => {
    expect(formatWindowTitle('123')).toBe('123');
    expect(formatWindowTitle('!!!')).toBe('!!!');
    expect(formatWindowTitle('   ')).toBe('   ');
  });

  it('handles a single lowercase letter', () => {
    expect(formatWindowTitle('a')).toBe('A');
  });

  it('handles a single uppercase letter', () => {
    expect(formatWindowTitle('A')).toBe('A');
  });

  it('uses Spanish locale casing for accented letters', () => {
    expect(formatWindowTitle('ángel')).toBe('Ángel');
    expect(formatWindowTitle('árbol de archivos')).toBe('Árbol de archivos');
    expect(formatWindowTitle('ñoño')).toBe('Ñoño');
    expect(formatWindowTitle('über')).toBe('Über');
  });

  it('treats accented letter after leading symbols correctly', () => {
    expect(formatWindowTitle('  ángel')).toBe('  Ángel');
  });

  it('does not alter non-letter unicode in the no-letter branch', () => {
    // First char uppercased (no-op for a digit) and rest preserved
    expect(formatWindowTitle('42')).toBe('42');
  });

  it('preserves trailing content exactly', () => {
    const input = 'mi ventana CON Mayúsculas y números 99';
    expect(formatWindowTitle(input)).toBe('Mi ventana CON Mayúsculas y números 99');
  });
});
