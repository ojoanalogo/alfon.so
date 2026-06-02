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
}

/**
 * The app primitive: metadata + a `body` (and optional `titleContent`). It
 * generates the standard render that wraps both in the shared <Window>.
 */
export function defineApp<Id extends string>(input: DefineAppInput<Id>): AppDefinition<Id> {
  const { body, titleContent, ...meta } = input;
  return {
    ...meta,
    render: (ctx, win) => {
      const app: AppDefinition = { ...meta, render: () => null };
      return (
        <Window
          {...win}
          title={resolveAppTitle(app, ctx)}
          titleContent={titleContent?.(ctx)}
          windowClassName={meta.windowClassName}
          bodyClassName={meta.bodyClassName}
        >
          {body(ctx, win)}
        </Window>
      );
    },
  };
}
