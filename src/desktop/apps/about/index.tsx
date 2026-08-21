import { defineApp } from '@desktop/wrappers';
import AboutContent from './AboutContent';

export default defineApp({
  id: 'about',
  title: 'about.html',
  iconKey: 'about',
  geometry: {
    defaultWidth: 576,
    minWidth: 520,
    initialZ: 11,
    center: true,
    defaultOpen: true,
  },
  desktopIcon: { label: 'acerca', tooltip: 'Mi info' },
  taskbarTooltip: 'about.html',
  windowClassName: 'desktop-window--fit-content',
  body: (ctx) => <AboutContent posts={ctx.posts} onOpenPost={ctx.onOpenPost} />,
});
