import type { ReactNode } from 'react';
import type { AppDefinition } from './defineApp';
import type { WindowAppContext } from './types';
import type { WindowDef, WindowGeometry, WindowState } from '../types';
import Window from '../window';
import ExplorerWindow from '../window/ExplorerWindow';
import ExplorerLayout from '../layouts/ExplorerLayout';
import BrowserChrome from '../browser/BrowserChrome';
import BrowserContent from '../browser/BrowserContent';
import SettingsBody from './contents/SettingsBody';
import TerminalApp from '../TerminalApp';
import { minWidthForDef } from '../useWindowManager';
import { resolveAppTitle } from './defineApp';
import { cascadeOffset } from './cascadePositions';

/** Window manager callbacks renderApp needs (passed by DesktopApp). */
export interface WindowCallbacks {
  focus: (id: string) => void;
  close: (id: string) => void;
  minimize: (id: string) => void;
  toggleMaximize: (id: string) => void;
  setGeometry: (id: string, geometry: Partial<WindowGeometry>) => void;
}

interface RenderAppOptions {
  app: AppDefinition;
  def: WindowDef;
  state: WindowState;
  focused: boolean;
  ctx: WindowAppContext;
  callbacks: WindowCallbacks;
}

/**
 * Single dispatcher: maps an app's `layout.kind` to the right window shell
 * (Window vs ExplorerWindow) and the right body.
 *
 * App authors never call this directly — they just `defineApp(...)` and the
 * runtime wires the shell.
 */
export function renderApp({ app, def, state, focused, ctx, callbacks }: RenderAppOptions): ReactNode {
  const title = resolveAppTitle(app, ctx);

  const baseProps = {
    state,
    title,
    minWidth: minWidthForDef(def),
    windowClassName: app.chrome?.windowClassName,
    bodyClassName: app.chrome?.bodyClassName,
    focused,
    onFocus: () => callbacks.focus(app.id),
    onClose: () => callbacks.close(app.id),
    onMinimize: () => callbacks.minimize(app.id),
    onToggleMaximize: () => callbacks.toggleMaximize(app.id),
    onGeometryChange: (geometry: Partial<WindowGeometry>) =>
      callbacks.setGeometry(app.id, geometry),
  };

  switch (app.layout.kind) {
    case 'custom':
      return <Window {...baseProps}>{app.layout.render(ctx)}</Window>;

    case 'explorer': {
      const layout = app.layout;
      return (
        <ExplorerWindow {...baseProps} defaultMode={layout.defaultMode}>
          <ExplorerLayout
            items={layout.items(ctx)}
            onActivate={(id) => layout.onActivate?.(id, ctx)}
          />
          {layout.footer?.(ctx)}
        </ExplorerWindow>
      );
    }

    case 'browser':
      return (
        <Window
          {...baseProps}
          titleContent={
            <BrowserChrome
              appId={app.id}
              title={title}
              browsers={ctx.browsers}
              hideTitle={app.layout.hideTitle}
            />
          }
        >
          <BrowserContent appId={app.id} browsers={ctx.browsers} />
        </Window>
      );

    case 'terminal':
      return (
        <Window {...baseProps}>
          <TerminalApp posts={ctx.posts} focused={focused} />
        </Window>
      );

    case 'settings':
      return (
        <Window {...baseProps}>
          <SettingsBody sections={app.layout.sections} />
        </Window>
      );

    default: {
      // Exhaustiveness guard: a new AppLayout kind that forgets a case here
      // becomes a compile error instead of silently rendering a blank window.
      const _exhaustive: never = app.layout;
      throw new Error(`renderApp: unhandled layout kind "${(_exhaustive as { kind: string }).kind}"`);
    }
  }
}

/** Anchors for apps that omit explicit geometry — cascade down-right by order. */
const CASCADE_BASE = { baseX: 96, baseY: 48 };
const BASE_Z = 10;

/**
 * Convert an AppDefinition's geometry to a WindowDef the window manager
 * understands. Apps that omit `defaultX/Y` cascade from their registry order,
 * and `initialZ` defaults to `BASE_Z + index`, so the common case is zero-config.
 */
export function appToWindowDef(app: AppDefinition, index = 0): WindowDef {
  const geometry = app.geometry;
  const cascaded = cascadeOffset(index, CASCADE_BASE);
  return {
    id: app.id,
    title: typeof app.title === 'string' ? app.title : app.id,
    ...geometry,
    defaultX: geometry.defaultX ?? cascaded.x,
    defaultY: geometry.defaultY ?? cascaded.y,
    initialZ: geometry.initialZ ?? BASE_Z + index,
  };
}
