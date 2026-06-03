import { defineApp } from '@desktop/wrappers';
import ClassifiedContent from '../classified/ClassifiedContent';
import { CLASSIFIED_DOCS } from '../classified/classifiedDocs';

export default defineApp({
  id: 'ovnis',
  title: 'ovnis.pdf — SOLO LECTURA',
  iconKey: 'classified',
  geometry: { defaultX: 250, defaultY: 150, defaultWidth: 560, initialZ: 15 },
  desktopIcon: false,
  body: () => <ClassifiedContent doc={CLASSIFIED_DOCS.ovnis} />,
});
