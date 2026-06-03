import type { ReactNode } from 'react';
import Window from '../window';
import type { IconKey } from '@desktop/lib/desktopIcons';
import type { AppGeometry } from '../types';
import {
  resolveAppTitle,
  type AppContext,
  type AppDefinition,
  type DesktopIconConfig,
  type WindowChromeProps,
} from './types';

export interface DefineAppInput<Id extends string> {
  id: Id;
  title: string | ((ctx: AppContext) => string);
  iconKey?: IconKey;
  iconUrl?: string;
  geometry: AppGeometry;
  desktopIcon?: DesktopIconConfig | false;
  taskbarTooltip?: string;
  availableWhen?: AppDefinition['availableWhen'];
  windowClassName?: string;
  bodyClassName?: string;
  initialBrowserUrl?: string | null;
  /** Window body. The optional `win` arg is the live window-manager wiring. */
  body: (ctx: AppContext, win?: WindowChromeProps) => ReactNode;
  /** Optional titlebar chrome (e.g. the browser URL bar). */
  titleContent?: (ctx: AppContext) => ReactNode;
  /**
   * Optional custom window shell; defaults to the shared `<Window>`. Receives the
   * window-manager wiring plus the resolved title and rendered body, and is
   * responsible for mounting them. Used by archetypes that must wrap `<Window>` in
   * a provider (e.g. the explorer view-mode context), so every archetype still
   * funnels through `defineApp` instead of building its own `render`.
   */
  renderWindow?: (args: {
    win: WindowChromeProps;
    title: string;
    titleContent: ReactNode;
    children: ReactNode;
  }) => ReactNode;
}

/**
 * The app primitive: metadata + a `body` (and optional `titleContent`). It
 * generates the standard render that wraps both in the shared <Window>.
 */
export function defineApp<Id extends string>(input: DefineAppInput<Id>): AppDefinition<Id> {
  const { body, titleContent, renderWindow, ...meta } = input;
  return {
    ...meta,
    render: (ctx, win) => {
      const title = resolveAppTitle(meta, ctx);
      const tc = titleContent?.(ctx);
      const children = body(ctx, win);
      if (renderWindow) {
        return renderWindow({ win, title, titleContent: tc, children });
      }
      return (
        <Window
          {...win}
          title={title}
          titleContent={tc}
          windowClassName={meta.windowClassName}
          bodyClassName={meta.bodyClassName}
        >
          {children}
        </Window>
      );
    },
  };
}
