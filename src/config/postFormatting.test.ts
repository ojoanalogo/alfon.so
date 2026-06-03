import { describe, it, expect } from 'vitest';
import {
  POST_DATE_MIN_WIDTH,
  postDateFormatter,
  postLongDateFormatter,
  formatPostDate,
} from './postFormatting';

describe('postFormatting', () => {
  describe('POST_DATE_MIN_WIDTH', () => {
    it('is the documented constant value', () => {
      expect(POST_DATE_MIN_WIDTH).toBe(120);
    });
  });

  describe('postDateFormatter', () => {
    it('is an Intl.DateTimeFormat using the es-MX locale', () => {
      expect(postDateFormatter).toBeInstanceOf(Intl.DateTimeFormat);
      expect(postDateFormatter.resolvedOptions().locale).toBe('es-MX');
    });

    it('uses short month, numeric day, and numeric year', () => {
      const opts = postDateFormatter.resolvedOptions();
      expect(opts.day).toBe('numeric');
      expect(opts.month).toBe('short');
      expect(opts.year).toBe('numeric');
    });

    it('formats a date with an abbreviated (short) month name', () => {
      // Jan 15 2024 in es-MX short form uses abbreviated month "ene"
      const formatted = postDateFormatter.format(new Date(2024, 0, 15));
      expect(formatted).toContain('2024');
      expect(formatted).toContain('15');
      expect(formatted.toLowerCase()).toContain('ene');
    });
  });

  describe('postLongDateFormatter', () => {
    it('is an Intl.DateTimeFormat using the es-MX locale', () => {
      expect(postLongDateFormatter).toBeInstanceOf(Intl.DateTimeFormat);
      expect(postLongDateFormatter.resolvedOptions().locale).toBe('es-MX');
    });

    it('uses long month, numeric day, and numeric year', () => {
      const opts = postLongDateFormatter.resolvedOptions();
      expect(opts.day).toBe('numeric');
      expect(opts.month).toBe('long');
      expect(opts.year).toBe('numeric');
    });

    it('formats a date with the full (long) month name', () => {
      // Jan 2024 in es-MX long form spells out the month "enero"
      const formatted = postLongDateFormatter.format(new Date(2024, 0, 15));
      expect(formatted.toLowerCase()).toContain('enero');
      expect(formatted).toContain('2024');
    });

    it('produces a longer string than the short formatter for the same date', () => {
      const d = new Date(2024, 0, 15);
      expect(postLongDateFormatter.format(d).length).toBeGreaterThan(
        postDateFormatter.format(d).length,
      );
    });
  });

  describe('formatPostDate', () => {
    it('formats a Date instance using the short formatter', () => {
      const d = new Date(2024, 0, 15);
      expect(formatPostDate(d)).toBe(postDateFormatter.format(d));
    });

    it('accepts an ISO date string and parses it before formatting', () => {
      const iso = '2024-01-15T00:00:00.000Z';
      const expected = postDateFormatter.format(new Date(iso));
      expect(formatPostDate(iso)).toBe(expected);
    });

    it('produces equal output for a Date and its equivalent ISO string', () => {
      const iso = '2023-06-20T12:00:00.000Z';
      expect(formatPostDate(iso)).toBe(formatPostDate(new Date(iso)));
    });

    it('returns the short (abbreviated month) representation, not the long one', () => {
      const d = new Date(2024, 0, 15);
      expect(formatPostDate(d)).not.toBe(postLongDateFormatter.format(d));
    });

    it('throws RangeError for an unparseable string (Invalid Date)', () => {
      // typeof 'string' branch -> new Date('nope') -> Invalid Date,
      // which Intl.DateTimeFormat.format rejects with "Invalid time value".
      expect(() => formatPostDate('not-a-real-date')).toThrow(RangeError);
    });
  });
});
