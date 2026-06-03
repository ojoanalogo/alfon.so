import type { ReactNode } from 'react';
import { defineApp } from '../defineApp';
import ExplorerWindow from './ExplorerWindow';
import ExplorerLayout from './ExplorerLayout';
import type { ExplorerViewMode, ListItem } from './types';
import { type AppContext, type AppDefinition } from '../types';
import type { AppGeometry } from '../../types';

export interface ExplorerAppInput<Id extends string> {
  id: Id;
  title: string | ((ctx: AppContext) => string);
  iconKey?: AppDefinition['iconKey'];
  iconUrl?: string;
  items: (ctx: AppContext) => ListItem[];
  /** Initial grid vs list layout when the folder window opens. */
  defaultMode?: ExplorerViewMode;
  onActivate?: (id: string, ctx: AppContext) => void;
  footer?: (ctx: AppContext) => ReactNode;
  geometry: AppGeometry;
  desktopIcon?: AppDefinition['desktopIcon'];
  availableWhen?: AppDefinition['availableWhen'];
  taskbarTooltip?: string;
}

/** File-list archetype: grid/list view + activate + optional footer. */
export function explorerApp<Id extends string>(input: ExplorerAppInput<Id>): AppDefinition<Id> {
  const { items, onActivate, footer, defaultMode, ...meta } = input;
  return defineApp({
    ...meta,
    body: (ctx) => (
      <>
        <ExplorerLayout items={items(ctx)} onActivate={(id) => onActivate?.(id, ctx)} />
        {footer?.(ctx)}
      </>
    ),
    // Explorer needs its <Window> wrapped in the view-mode provider, so it mounts
    // through this seam instead of defineApp's default <Window>.
    renderWindow: ({ win, title, children }) => (
      <ExplorerWindow {...win} title={title} defaultMode={defaultMode}>
        {children}
      </ExplorerWindow>
    ),
  });
}
