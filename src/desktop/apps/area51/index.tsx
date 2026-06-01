import { createElement } from 'react';
import { defineApp } from '@desktop/wrappers';
import ClassifiedContent from '../classified/ClassifiedContent';
import { CLASSIFIED_DOCS } from '../classified/classifiedDocs';

export default defineApp({
  id: 'area51',
  title: 'area51.pdf — CLASIFICADO',
  iconKey: 'classified',
  geometry: { defaultX: 220, defaultY: 120, defaultWidth: 560, initialZ: 14 },
  desktopIcon: false,
  body: () => createElement(ClassifiedContent, { doc: CLASSIFIED_DOCS.area51 }),
});
