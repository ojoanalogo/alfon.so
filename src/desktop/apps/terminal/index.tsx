import { createElement } from 'react';
import { defineApp } from '@desktop/wrappers';
import TerminalApp from './TerminalApp';

export default defineApp({
  id: 'terminal',
  title: 'terminal — guest@alfon.so',
  iconKey: 'terminal',
  geometry: { defaultX: 88, defaultY: 36, defaultWidth: 560, defaultHeight: 380, initialZ: 10 },
  desktopIcon: { label: 'terminal.sh', tooltip: 'Terminal' },
  taskbarTooltip: 'Terminal',
  bodyClassName: 'terminal-window__body',
  body: (ctx) => createElement(TerminalApp, { posts: ctx.posts, focused: true }),
});
