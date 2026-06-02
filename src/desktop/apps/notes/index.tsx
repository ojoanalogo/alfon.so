import { createElement } from 'react';
import { defineApp } from '@desktop/wrappers';
import NotesApp from './NotesApp';

export default defineApp({
  id: 'notes',
  title: 'notas',
  iconKey: 'notes',
  geometry: { defaultX: 180, defaultY: 80, defaultWidth: 640, defaultHeight: 440, initialZ: 14 },
  desktopIcon: { label: 'notas', tooltip: 'Notas' },
  taskbarTooltip: 'Notas',
  bodyClassName: 'notes-window__body',
  body: () => createElement(NotesApp),
});
