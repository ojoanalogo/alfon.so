import { describe, it, expect } from 'vitest';
import { fakeFileSize } from './fakeFileSize';

const SIZE_POOL = [
  '512 B',
  '4 KB',
  '12 KB',
  '48 KB',
  '128 KB',
  '847 KB',
  '1.2 MB',
  '4.7 MB',
  '24 MB',
];

// Reference implementation mirroring the source, used to assert the
// expected value for a given id without trusting the SUT to define it.
function expectedFor(id: string): string {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash + id.charCodeAt(index) * (index + 1)) % SIZE_POOL.length;
  }
  return SIZE_POOL[hash]!;
}

describe('fakeFileSize', () => {
  it('is deterministic: same input yields same output', () => {
    const inputs = ['readme.md', 'photo.png', 'a', '', 'some-long-id-123'];
    for (const id of inputs) {
      expect(fakeFileSize(id)).toBe(fakeFileSize(id));
    }
  });

  it('always returns a value from the known size pool', () => {
    const inputs = [
      '',
      'a',
      'b',
      'file.txt',
      'index.html',
      'a-much-longer-identifier-with-symbols-!@#',
      '12345',
      'résumé.pdf',
    ];
    for (const id of inputs) {
      expect(SIZE_POOL).toContain(fakeFileSize(id));
    }
  });

  it('returns a non-empty string in a recognizable "<number> <unit>" format', () => {
    for (const id of ['x', 'project', 'notes.md']) {
      const size = fakeFileSize(id);
      expect(typeof size).toBe('string');
      expect(size.length).toBeGreaterThan(0);
      expect(size).toMatch(/^\d+(\.\d+)? (B|KB|MB)$/);
    }
  });

  it('only uses B, KB, and MB units (within sane bounds)', () => {
    for (const entry of SIZE_POOL) {
      expect(entry).toMatch(/ (B|KB|MB)$/);
    }
    // Spot-check that real outputs only ever carry these units too.
    for (const id of ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta']) {
      const unit = fakeFileSize(id).split(' ')[1];
      expect(['B', 'KB', 'MB']).toContain(unit);
    }
  });

  it('matches the reference hash for a spread of inputs', () => {
    const inputs = [
      '',
      'a',
      'ab',
      'abc',
      'file.txt',
      'readme.md',
      'photo.png',
      'document.pdf',
      'archive.zip',
      'A',
      'Z',
      '0',
      '9',
      'the quick brown fox',
    ];
    for (const id of inputs) {
      expect(fakeFileSize(id)).toBe(expectedFor(id));
    }
  });

  it('handles the empty string by returning the first pool entry', () => {
    // Empty id never enters the loop, so hash stays 0 -> SIZE_POOL[0].
    expect(fakeFileSize('')).toBe('512 B');
  });

  it('can produce a variety of outputs across different inputs', () => {
    const outputs = new Set<string>();
    for (let i = 0; i < 200; i += 1) {
      outputs.add(fakeFileSize(`id-${i}`));
    }
    // The hash should spread across more than one bucket.
    expect(outputs.size).toBeGreaterThan(1);
    // And never escape the pool.
    for (const value of outputs) {
      expect(SIZE_POOL).toContain(value);
    }
  });

  it('is sensitive to character position (order matters)', () => {
    // index weighting means anagrams generally differ; assert a concrete pair.
    expect(fakeFileSize('ab')).toBe(expectedFor('ab'));
    expect(fakeFileSize('ba')).toBe(expectedFor('ba'));
    // Demonstrate position-sensitivity exists somewhere in the space.
    const differs = ['ab', 'ba', 'xy', 'yx', 'abc', 'cba'].some(
      (s) => fakeFileSize(s) !== fakeFileSize(s.split('').reverse().join('')),
    );
    expect(differs).toBe(true);
  });
});
