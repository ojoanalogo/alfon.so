import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { makeAppContext, makeWindowChromeProps, makeWindowState } from '@test/factories';
import { explorerApp } from './explorerApp';
import type { ListItem } from './types';
import type { AppContext } from '../types';
import type { AppGeometry } from '../../types';

const GEOMETRY: AppGeometry = {
  defaultX: 0,
  defaultY: 0,
  defaultWidth: 600,
  defaultHeight: 400,
  minWidth: 400,
  initialZ: 10,
};

const ITEMS: ListItem[] = [
  { id: 'one', label: 'First Item', kind: 'Proyecto' },
  { id: 'two', label: 'Second Item', kind: 'PDF' },
  { id: 'three', label: 'Disabled Item', disabled: true },
];

function win() {
  return makeWindowChromeProps({ state: makeWindowState({ open: true }) });
}

describe('explorerApp', () => {
  it('returns an AppDefinition that preserves metadata and omits explorer-only fields', () => {
    const app = explorerApp({
      id: 'folder',
      title: 'my folder',
      geometry: GEOMETRY,
      items: () => ITEMS,
      onActivate: vi.fn(),
      defaultMode: 'list',
    });

    expect(app.id).toBe('folder');
    expect(app.title).toBe('my folder');
    expect(app.geometry).toBe(GEOMETRY);
    expect(typeof app.render).toBe('function');
    // explorer-specific config stays internal, not on the definition
    expect('items' in app).toBe(false);
    expect('onActivate' in app).toBe(false);
    expect('defaultMode' in app).toBe(false);
    expect('footer' in app).toBe(false);
  });

  it('renders all item labels from items(ctx)', () => {
    const app = explorerApp({
      id: 'folder',
      title: 'folder',
      geometry: GEOMETRY,
      items: () => ITEMS,
    });

    render(app.render(makeAppContext(), win()));

    expect(screen.getByText('First Item')).toBeTruthy();
    expect(screen.getByText('Second Item')).toBeTruthy();
    expect(screen.getByText('Disabled Item')).toBeTruthy();
  });

  it('passes the AppContext into the items factory', () => {
    const itemsFn = vi.fn((_ctx: AppContext) => ITEMS);
    const ctx = makeAppContext();
    const app = explorerApp({
      id: 'folder',
      title: 'folder',
      geometry: GEOMETRY,
      items: itemsFn,
    });

    render(app.render(ctx, win()));

    expect(itemsFn).toHaveBeenCalled();
    expect(itemsFn.mock.calls[0][0]).toBe(ctx);
  });

  it('invokes onActivate(id, ctx) when an enabled item is clicked', () => {
    const onActivate = vi.fn();
    const ctx = makeAppContext();
    const app = explorerApp({
      id: 'folder',
      title: 'folder',
      geometry: GEOMETRY,
      items: () => ITEMS,
      onActivate,
    });

    render(app.render(ctx, win()));
    fireEvent.click(screen.getByText('First Item'));

    expect(onActivate).toHaveBeenCalledWith('one', ctx);
  });

  it('does not activate a disabled item (rendered as a non-button)', () => {
    const onActivate = vi.fn();
    const app = explorerApp({
      id: 'folder',
      title: 'folder',
      geometry: GEOMETRY,
      items: () => ITEMS,
      onActivate,
    });

    render(app.render(makeAppContext(), win()));
    fireEvent.click(screen.getByText('Disabled Item'));

    expect(onActivate).not.toHaveBeenCalled();
  });

  it('renders the optional footer', () => {
    const app = explorerApp({
      id: 'folder',
      title: 'folder',
      geometry: GEOMETRY,
      items: () => ITEMS,
      footer: () => <p>footer text</p>,
    });

    render(app.render(makeAppContext(), win()));

    expect(screen.getByText('footer text')).toBeTruthy();
  });

  it('renders the resolved (function) title via formatWindowTitle', () => {
    const app = explorerApp({
      id: 'folder',
      title: (ctx: AppContext) => `items: ${ctx.posts.length}`,
      geometry: GEOMETRY,
      items: () => ITEMS,
    });

    const { container } = render(app.render(makeAppContext({ posts: [] }), win()));
    // "items: 0" -> first letter uppercased -> "Items: 0"
    expect(container.textContent).toContain('Items: 0');
  });

  it('renders an empty grid without crashing when there are no items', () => {
    const app = explorerApp({
      id: 'folder',
      title: 'empty',
      geometry: GEOMETRY,
      items: () => [],
    });

    const { container } = render(app.render(makeAppContext(), win()));
    const list = container.querySelector('[role="list"]');
    expect(list).toBeTruthy();
    expect(list?.children.length).toBe(0);
  });

  it('renders in grid mode by default (grid body class)', () => {
    const app = explorerApp({
      id: 'folder',
      title: 'folder',
      geometry: GEOMETRY,
      items: () => ITEMS,
    });

    const { container } = render(app.render(makeAppContext(), win()));
    expect(container.querySelector('.card-body--explorer-grid')).toBeTruthy();
    expect(container.querySelector('.card-body--explorer-list')).toBeNull();
  });

  it('renders in list mode when defaultMode is "list"', () => {
    const app = explorerApp({
      id: 'folder',
      title: 'folder',
      geometry: GEOMETRY,
      items: () => ITEMS,
      defaultMode: 'list',
    });

    const { container } = render(app.render(makeAppContext(), win()));
    expect(container.querySelector('.card-body--explorer-list')).toBeTruthy();
  });
});
