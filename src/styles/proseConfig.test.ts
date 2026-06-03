import { describe, it, expect } from 'vitest';
import { PROSE_CLASS_BASE, PROSE_CLASS_RESPONSIVE } from './proseConfig';

const PROSE_CORE = [
  'prose prose-base max-w-none prose-zinc dark:prose-invert',
  'prose-headings:scroll-mt-20 prose-headings:font-bold prose-headings:text-primary',
  'prose-h1:text-2xl',
  'prose-h2:mt-8 prose-h2:mb-3 prose-h2:text-xl',
  'prose-h3:mt-6 prose-h3:mb-2 prose-h3:text-lg',
  'prose-p:leading-relaxed prose-p:text-secondary',
  'prose-a:text-primary hover:prose-a:text-accent prose-a:no-underline hover:prose-a:underline',
  'prose-blockquote:rounded-r prose-blockquote:border-l-zinc-400/60 dark:prose-blockquote:border-l-zinc-500/60',
  'prose-blockquote:bg-black/[0.04] dark:prose-blockquote:bg-white/[0.04]',
  'prose-blockquote:px-4 prose-blockquote:py-1',
  'prose-strong:font-semibold prose-strong:text-primary',
  'prose-code:rounded prose-code:bg-black/[0.06] dark:prose-code:bg-white/[0.08]',
  'prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:text-primary',
  'prose-code:before:content-none prose-code:after:content-none',
  'prose-pre:border prose-pre:border-gray-300/50 prose-pre:bg-surface prose-pre:text-sm dark:prose-pre:border-gray-700/50',
  'prose-li:text-secondary prose-li:marker:text-muted',
  'prose-img:rounded-lg prose-img:shadow-md',
].join(' ');

describe('PROSE_CLASS_BASE', () => {
  it('is exactly the core prose class string (no responsive variants)', () => {
    expect(PROSE_CLASS_BASE).toBe(PROSE_CORE);
  });

  it('carries no md: responsive tokens', () => {
    expect(PROSE_CLASS_BASE).not.toContain('md:');
  });
});

describe('PROSE_CLASS_RESPONSIVE', () => {
  it('starts with the base class so the two stay in lockstep', () => {
    expect(PROSE_CLASS_RESPONSIVE.startsWith(PROSE_CLASS_BASE)).toBe(true);
  });

  it('adds the responsive sizing tokens on top of the base', () => {
    expect(PROSE_CLASS_RESPONSIVE).toContain('md:prose-lg');
    expect(PROSE_CLASS_RESPONSIVE).toContain('md:prose-h2:text-2xl');
  });

  it('is strictly longer than the base — it only appends, never rewrites', () => {
    expect(PROSE_CLASS_RESPONSIVE.length).toBeGreaterThan(PROSE_CLASS_BASE.length);
    expect(PROSE_CLASS_RESPONSIVE.slice(PROSE_CLASS_BASE.length)).toContain('md:');
  });
});
