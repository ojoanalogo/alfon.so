import { createElement } from 'react';
import { explorerApp } from '@desktop/wrappers';
import type { ListItem } from '../../wrappers/explorer/types';
import { appIconSrc } from '../appIcons';
// registry also imports this module; the cycle is safe — findApp() is only
// called at render time (inside items()), not during module initialisation.
import { findApp } from '../registry';
import { TRASH_JUNK } from './junk';
import TrashFooter from './TrashFooter';

export default explorerApp({
  id: 'trash',
  title: '🗑 Papelera',
  iconKey: 'trash',
  items: (ctx) => {
    const junk = TRASH_JUNK.map<ListItem>((entry) => {
      const app = entry.appId ? findApp(entry.appId) : undefined;
      return {
        id: entry.id,
        label: entry.name,
        kind: entry.kind,
        iconSrc: app ? appIconSrc(app, ctx.iconUrls) : entry.iconSrc,
        isFolder: entry.isFolder,
        size: entry.size,
        disabled: !entry.appId,
      };
    });
    const deleted = ctx.trash.items.map<ListItem>((item) => ({
      id: item.id,
      label: item.label,
      kind: 'Icono eliminado',
      iconSrc: item.iconSrc,
    }));
    return [...junk, ...deleted];
  },
  onActivate: (id, ctx) => {
    const junk = TRASH_JUNK.find((entry) => entry.id === id);
    if (junk?.appId) {
      ctx.trash.onOpenFile(junk.appId);
      return;
    }
    if (ctx.trash.items.some((item) => item.id === id)) {
      ctx.trash.onRestore(id);
    }
  },
  footer: (ctx) => createElement(TrashFooter, { trash: ctx.trash }),
  geometry: { defaultX: 320, defaultY: 140, defaultWidth: 420, initialZ: 17 },
  desktopIcon: false,
});
