import { describe, expect, it } from 'vitest';
import { resolveWindowChrome } from './windowChrome';

const base = {
  displayMaximized: false,
  posX: 100,
  posY: 50,
  layoutWidth: 600,
  minWidth: 400,
  height: 300 as number | null,
  defaultHeight: undefined as number | undefined,
  minHeight: undefined as number | undefined,
  zIndex: 12,
  maximized: false,
  maximizeTransition: false,
  focused: false,
  windowClassName: undefined as string | undefined,
  open: true,
  minimized: false,
};

describe('resolveWindowChrome', () => {
  it('positions a normal window from x/y/width/height', () => {
    const { style } = resolveWindowChrome(base);
    expect(style).toMatchObject({
      left: '100px',
      top: '50px',
      width: '600px',
      minWidth: '400px',
      height: '300px',
      zIndex: 12,
      transformOrigin: 'bottom center',
    });
  });

  it('uses inset:0 + auto sizing when displayMaximized', () => {
    const { style } = resolveWindowChrome({ ...base, displayMaximized: true });
    expect(style).toMatchObject({
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      width: 'auto',
      height: 'auto',
      transformOrigin: 'center center',
    });
  });

  it('derives status from open/minimized', () => {
    expect(resolveWindowChrome({ ...base, open: false }).status).toBe('closed');
    expect(resolveWindowChrome({ ...base, minimized: true }).status).toBe('minimized');
    expect(resolveWindowChrome(base).status).toBe('open');
  });

  it('is interactive only when open and not minimized', () => {
    expect(resolveWindowChrome(base).interactive).toBe(true);
    expect(resolveWindowChrome({ ...base, minimized: true }).interactive).toBe(false);
    expect(resolveWindowChrome({ ...base, open: false }).interactive).toBe(false);
  });

  it('marks sized via is-sized for fixed-height, maximized, and min-height floors', () => {
    expect(resolveWindowChrome(base).className).toContain('is-sized');
    expect(resolveWindowChrome({ ...base, height: null }).className).not.toContain('is-sized');
    expect(resolveWindowChrome({ ...base, height: null, maximized: true }).className).toContain(
      'is-sized',
    );
    expect(resolveWindowChrome({ ...base, height: null, minHeight: 200 }).className).toContain(
      'is-sized',
    );
  });

  it('composes state classes and the caller className', () => {
    const { className } = resolveWindowChrome({
      ...base,
      maximized: true,
      maximizeTransition: true,
      focused: true,
      windowClassName: 'app-notes',
    });
    // split() so the base class isn't satisfied by a substring of a modifier
    // (e.g. 'desktop-window--expanded' contains 'desktop-window').
    const classes = className.split(' ');
    expect(classes).toContain('desktop-window');
    expect(className).toContain('desktop-window--expanded');
    expect(className).toContain('desktop-window--maximize-transition');
    expect(className).toContain('is-focused');
    expect(className).toContain('app-notes');
  });
});
