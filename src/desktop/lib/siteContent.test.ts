import { describe, it, expect } from 'vitest';
import {
  SITE,
  siteMailFromLine,
  terminalAboutCommandLines,
  terminalCatAboutLines,
  terminalCatPhotosLines,
  terminalCatStartupLines,
} from './siteContent';

describe('SITE', () => {
  it('exposes core contact fields', () => {
    expect(SITE.person.email).toBe('hola@alfon.so');
    expect(SITE.person.displayName).toBe('alfonso reyes');
    expect(SITE.work.url).toMatch(/^https?:\/\//);
  });
});

describe('terminalAboutCommandLines', () => {
  it('includes site name, work, hobby, and email', () => {
    const lines = terminalAboutCommandLines();
    expect(lines[0]).toContain('alfon.so');
    expect(lines.some((l) => l.includes('monopolio.com.mx'))).toBe(true);
    expect(lines.some((l) => l.includes('ojoanalogo.com'))).toBe(true);
    expect(lines.some((l) => l.includes('hola@alfon.so'))).toBe(true);
  });
});

describe('terminalCatAboutLines', () => {
  it('includes display name and welcome text', () => {
    const lines = terminalCatAboutLines();
    expect(lines.some((l) => l.includes('alfonso reyes'))).toBe(true);
    expect(lines).toContain(SITE.welcome.terminal);
    expect(lines.some((l) => l.includes('hola@alfon.so'))).toBe(true);
  });
});

describe('terminalCatPhotosLines', () => {
  it('points to the photography portfolio url', () => {
    expect(terminalCatPhotosLines()[0]).toContain(SITE.photos.url);
  });
});

describe('terminalCatStartupLines', () => {
  it('mentions molecula.digital', () => {
    const lines = terminalCatStartupLines();
    expect(lines.some((l) => l.includes(SITE.startup.name))).toBe(true);
    expect(lines.some((l) => l.includes(SITE.startup.url))).toBe(true);
  });
});

describe('siteMailFromLine', () => {
  it('formats name and email for mail clients', () => {
    expect(siteMailFromLine()).toBe('alfonso reyes <hola@alfon.so>');
  });
});
