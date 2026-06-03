import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { makeAppContext, makeWindowChromeProps, makeWindowState } from '@test/factories';
import { defineApp } from './defineApp';
import type { AppContext } from './types';
import type { AppGeometry } from '../types';

const GEOMETRY: AppGeometry = {
  defaultX: 0,
  defaultY: 0,
  defaultWidth: 600,
  defaultHeight: 400,
  minWidth: 400,
  initialZ: 10,
};

describe('defineApp', () => {
  it('returns an AppDefinition that preserves the metadata', () => {
    const app = defineApp({
      id: 'demo',
      title: 'demo app',
      iconKey: 'startup',
      geometry: GEOMETRY,
      taskbarTooltip: 'tooltip',
      windowClassName: 'my-window',
      bodyClassName: 'my-body',
      body: () => <p>hello</p>,
    });

    expect(app.id).toBe('demo');
    expect(app.title).toBe('demo app');
    expect(app.iconKey).toBe('startup');
    expect(app.geometry).toBe(GEOMETRY);
    expect(app.taskbarTooltip).toBe('tooltip');
    expect(app.windowClassName).toBe('my-window');
    expect(app.bodyClassName).toBe('my-body');
    expect(typeof app.render).toBe('function');
  });

  it('does not leak body/titleContent onto the definition object', () => {
    const app = defineApp({
      id: 'demo',
      title: 'demo',
      geometry: GEOMETRY,
      body: () => <p>x</p>,
      titleContent: () => <span>chrome</span>,
    });

    expect('body' in app).toBe(false);
    expect('titleContent' in app).toBe(false);
  });

  it('render() produces a Window containing the body text', () => {
    const app = defineApp({
      id: 'demo',
      title: 'demo',
      geometry: GEOMETRY,
      body: () => <p>body content here</p>,
    });

    render(app.render(makeAppContext(), makeWindowChromeProps({ state: makeWindowState({ open: true }) })));

    expect(screen.getByText('body content here')).toBeTruthy();
  });

  it('resolves a string title (uppercasing the first letter via formatWindowTitle)', () => {
    const app = defineApp({
      id: 'demo',
      title: 'navegador',
      geometry: GEOMETRY,
      body: () => <p>x</p>,
    });

    const { container } = render(
      app.render(makeAppContext(), makeWindowChromeProps({ state: makeWindowState({ open: true }) })),
    );

    // formatWindowTitle uppercases the first letter -> "Navegador"
    expect(container.textContent).toContain('Navegador');
  });

  it('resolves a function title using the AppContext', () => {
    const app = defineApp<'demo'>({
      id: 'demo',
      title: (ctx: AppContext) => `posts: ${ctx.posts.length}`,
      geometry: GEOMETRY,
      body: () => <p>x</p>,
    });

    const ctx = makeAppContext({ posts: [] });
    const { container } = render(
      app.render(ctx, makeWindowChromeProps({ state: makeWindowState({ open: true }) })),
    );

    // "posts: 0" -> first letter "p" uppercased -> "Posts: 0"
    expect(container.textContent).toContain('Posts: 0');
  });

  it('passes the live AppContext and win wiring into the body callback', () => {
    const ctx = makeAppContext();
    const win = makeWindowChromeProps({ state: makeWindowState({ open: true }) });
    let receivedCtx: AppContext | undefined;
    let receivedWin: unknown;

    const app = defineApp({
      id: 'demo',
      title: 'demo',
      geometry: GEOMETRY,
      body: (c, w) => {
        receivedCtx = c;
        receivedWin = w;
        return <p>captured</p>;
      },
    });

    render(app.render(ctx, win));

    expect(receivedCtx).toBe(ctx);
    expect(receivedWin).toBe(win);
  });

  it('renders titleContent in the titlebar when provided', () => {
    const app = defineApp({
      id: 'demo',
      title: 'demo',
      geometry: GEOMETRY,
      titleContent: () => <span>custom-chrome</span>,
      body: () => <p>body</p>,
    });

    render(app.render(makeAppContext(), makeWindowChromeProps({ state: makeWindowState({ open: true }) })));

    expect(screen.getByText('custom-chrome')).toBeTruthy();
    expect(screen.getByText('body')).toBeTruthy();
  });

  it('applies windowClassName to the rendered window root', () => {
    const app = defineApp({
      id: 'demo',
      title: 'demo',
      geometry: GEOMETRY,
      windowClassName: 'desktop-window--special',
      body: () => <p>body</p>,
    });

    const { container } = render(
      app.render(makeAppContext(), makeWindowChromeProps({ state: makeWindowState({ open: true }) })),
    );

    expect(container.querySelector('.desktop-window--special')).toBeTruthy();
  });
});
