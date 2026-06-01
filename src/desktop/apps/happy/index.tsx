import { createElement } from 'react';
import { defineApp } from '@desktop/wrappers';
import HappyContent from './HappyContent';

export default defineApp({
  id: 'happy',
  title: 'no_abrir.mp4',
  iconKey: 'video',
  geometry: { defaultX: 280, defaultY: 84, defaultWidth: 600, initialZ: 16 },
  desktopIcon: false,
  body: () => createElement(HappyContent),
});
