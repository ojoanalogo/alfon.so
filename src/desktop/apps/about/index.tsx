import { createElement } from 'react';
import { defineApp } from '@desktop/wrappers';
import AboutContent from './AboutContent';

export default defineApp({
  id: 'about',
  title: 'about.txt',
  iconKey: 'about',
  geometry: {
    defaultX: 0,
    defaultY: 0,
    defaultWidth: 576,
    minWidth: 520,
    initialZ: 11,
    center: true,
    defaultOpen: true,
  },
  desktopIcon: { label: 'about.txt', tooltip: 'Mi info' },
  taskbarTooltip: 'about.txt',
  body: () => createElement(AboutContent),
});
