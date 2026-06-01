import { defineApp } from '../defineApp';
import BrowserChrome from './BrowserChrome';
import BrowserContent from './BrowserContent';
import type { AppContext, AppDefinition } from '../types';
import type { AppGeometry } from '../../types';

export interface BrowserAppInput<Id extends string> {
  id: Id;
  title?: string;
  iconKey?: AppDefinition['iconKey'];
  iconUrl?: string;
  initialUrl?: string | null;
  hideTitle?: boolean;
  geometry?: Partial<AppGeometry>;
  desktopIcon?: AppDefinition['desktopIcon'];
  availableWhen?: AppDefinition['availableWhen'];
  taskbarTooltip?: string;
}

const DEFAULT_BROWSER_GEOMETRY: AppGeometry = {
  defaultX: 180,
  defaultY: 80,
  defaultWidth: 800,
  defaultHeight: 520,
  minWidth: 480,
  initialZ: 30,
};

function browserTitle<Id extends string>(input: BrowserAppInput<Id>) {
  const fallback = input.title ?? 'navegador';
  return (ctx: AppContext) => {
    const url = ctx.browsers.get(input.id).url ?? input.initialUrl ?? null;
    if (!url) return fallback;
    try {
      return new URL(url).host;
    } catch {
      return fallback;
    }
  };
}

/** Site-launcher / browser archetype: URL chrome in the titlebar + iframe body. */
export function browserApp<Id extends string>(input: BrowserAppInput<Id>): AppDefinition<Id> {
  const fallback = input.title ?? 'navegador';
  const title = browserTitle(input);
  return defineApp({
    id: input.id,
    title,
    iconKey: input.iconKey ?? 'startup',
    iconUrl: input.iconUrl,
    geometry: { ...DEFAULT_BROWSER_GEOMETRY, ...input.geometry },
    desktopIcon: input.desktopIcon ?? false,
    availableWhen: input.availableWhen,
    taskbarTooltip: input.taskbarTooltip ?? fallback,
    windowClassName: 'desktop-window--browser',
    bodyClassName: 'browser-window__body',
    initialBrowserUrl: input.initialUrl ?? null,
    titleContent: (ctx) => (
      <BrowserChrome
        appId={input.id}
        title={title(ctx)}
        browsers={ctx.browsers}
        hideTitle={input.hideTitle}
      />
    ),
    body: (ctx) => <BrowserContent appId={input.id} browsers={ctx.browsers} />,
  });
}
