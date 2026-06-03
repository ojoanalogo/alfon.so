import { describe, it, expect } from 'vitest';
import { normalizeBrowserUrl, isFrameBlockedUrl } from './browserUtils';

describe('normalizeBrowserUrl', () => {
  describe('invalid / empty input fallbacks', () => {
    it('returns null for an empty string', () => {
      expect(normalizeBrowserUrl('')).toBeNull();
    });

    it('returns null for whitespace-only input', () => {
      expect(normalizeBrowserUrl('   ')).toBeNull();
    });

    it('returns null for about:blank', () => {
      expect(normalizeBrowserUrl('about:blank')).toBeNull();
    });

    it('returns null for about:blank surrounded by whitespace', () => {
      expect(normalizeBrowserUrl('  about:blank  ')).toBeNull();
    });

    it('returns null for non-http(s) protocols like ftp', () => {
      expect(normalizeBrowserUrl('ftp://example.com')).toBeNull();
    });

    it('returns null for the file: protocol', () => {
      expect(normalizeBrowserUrl('file:///etc/hosts')).toBeNull();
    });

    it('returns null for javascript: protocol', () => {
      // javascript: is a valid URL scheme but not http/https
      expect(normalizeBrowserUrl('javascript:alert(1)')).toBeNull();
    });

    it('returns null for mailto: protocol', () => {
      expect(normalizeBrowserUrl('mailto:foo@bar.com')).toBeNull();
    });

    it('returns null when URL parsing throws', () => {
      // A bare scheme prefix that triggers the protocol regex but is unparseable.
      expect(normalizeBrowserUrl('http://')).toBeNull();
    });
  });

  describe('valid urls with explicit protocol', () => {
    it('keeps an https URL and normalizes it (adds trailing slash for root)', () => {
      expect(normalizeBrowserUrl('https://example.com')).toBe('https://example.com/');
    });

    it('keeps an http URL', () => {
      expect(normalizeBrowserUrl('http://example.com')).toBe('http://example.com/');
    });

    it('preserves path, query, and hash', () => {
      const result = normalizeBrowserUrl('https://example.com/path?q=1#frag');
      expect(result).toBe('https://example.com/path?q=1#frag');
    });

    it('is case-insensitive on the protocol detection regex', () => {
      expect(normalizeBrowserUrl('HTTPS://Example.com')).toBe('https://example.com/');
    });

    it('preserves a port', () => {
      expect(normalizeBrowserUrl('http://localhost:3000')).toBe('http://localhost:3000/');
    });
  });

  describe('bare hosts get https:// prepended', () => {
    it('prepends https:// to a bare host', () => {
      expect(normalizeBrowserUrl('example.com')).toBe('https://example.com/');
    });

    it('prepends https:// to a host with a path', () => {
      expect(normalizeBrowserUrl('example.com/foo/bar')).toBe('https://example.com/foo/bar');
    });

    it('prepends https:// to a host with a subdomain', () => {
      expect(normalizeBrowserUrl('www.example.com')).toBe('https://www.example.com/');
    });

    it('handles a bare host with a query string', () => {
      expect(normalizeBrowserUrl('example.com?x=1')).toBe('https://example.com/?x=1');
    });

    it('trims surrounding whitespace before prepending protocol', () => {
      expect(normalizeBrowserUrl('  example.com  ')).toBe('https://example.com/');
    });

    it('treats localhost (no dot) as a bare host', () => {
      expect(normalizeBrowserUrl('localhost')).toBe('https://localhost/');
    });
  });

  describe('determinism', () => {
    it('returns the same output for the same input', () => {
      const a = normalizeBrowserUrl('example.com/page');
      const b = normalizeBrowserUrl('example.com/page');
      expect(a).toBe(b);
    });
  });
});

describe('isFrameBlockedUrl', () => {
  it('returns false for null / undefined / empty', () => {
    expect(isFrameBlockedUrl(null)).toBe(false);
    expect(isFrameBlockedUrl(undefined)).toBe(false);
    expect(isFrameBlockedUrl('')).toBe(false);
  });

  it('returns false for an unparseable url', () => {
    expect(isFrameBlockedUrl('not a url')).toBe(false);
  });

  it('flags a known blocked host', () => {
    expect(isFrameBlockedUrl('https://github.com/torvalds')).toBe(true);
    expect(isFrameBlockedUrl('https://x.com/home')).toBe(true);
    expect(isFrameBlockedUrl('https://youtube.com/watch?v=abc')).toBe(true);
  });

  it('matches subdomains of a blocked host (suffix match)', () => {
    expect(isFrameBlockedUrl('https://gist.github.com/foo')).toBe(true);
    expect(isFrameBlockedUrl('https://www.linkedin.com/in/foo')).toBe(true);
  });

  it('does not flag a host that merely ends with a blocked label (no dot boundary)', () => {
    // "notgithub.com" must NOT match "github.com"
    expect(isFrameBlockedUrl('https://notgithub.com')).toBe(false);
    expect(isFrameBlockedUrl('https://mygoogle.com')).toBe(false);
  });

  it('returns false for an embeddable site', () => {
    expect(isFrameBlockedUrl('https://ojoanalogo.com')).toBe(false);
    expect(isFrameBlockedUrl('https://example.com/path')).toBe(false);
  });

  it('is case-insensitive on the host', () => {
    expect(isFrameBlockedUrl('https://GitHub.com')).toBe(true);
  });
});
