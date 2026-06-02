import { createElement } from 'react';
import { defineApp } from '@desktop/wrappers';
import NotesApp from './NotesApp';

export default defineApp({
  id: 'notes',
  title: 'notas',
  iconKey: 'notes',
  geometry: { defaultX: 230, defaultY: 80, defaultWidth: 840, defaultHeight: 440, initialZ: 14 },
  desktopIcon: { label: 'notes', tooltip: 'Notas' },
  taskbarTooltip: 'Notas',
  bodyClassName: 'notes-window__body',
  body: () => createElement(NotesApp),
});
