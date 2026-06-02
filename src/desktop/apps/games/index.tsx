import { explorerApp } from '@desktop/wrappers';
import type { ListItem } from '../../wrappers/explorer/types';

const GAMES: ListItem[] = [
  {
    id: 'snake',
    label: 'snake.exe',
    kind: 'Juego',
    graphic: '🐍',
    title: 'Snake — flechas o WASD',
  },
  {
    id: 'pong',
    label: 'pong.exe',
    kind: 'Juego',
    graphic: '🏓',
    title: 'Pong — rebota la pelota con la paleta',
  },
  {
    id: 'breakout',
    label: 'breakout.exe',
    kind: 'Juego',
    graphic: '🧱',
    title: 'Breakout — rompe todos los bloques',
  },
  {
    id: 'plane',
    label: 'plane.exe',
    kind: 'Juego',
    graphic: '✈️',
    title: 'Plane — esquiva obstáculos con ← → / A D',
  },
];

export default explorerApp({
  id: 'games',
  title: 'juegos/',
  iconKey: 'games',
  defaultMode: 'grid',
  items: () => GAMES,
  onActivate: (id, ctx) => ctx.onOpenApp(id),
  geometry: { defaultX: 200, defaultY: 88, defaultWidth: 480, defaultHeight: 340, initialZ: 13 },
  desktopIcon: { label: 'Juegos', tooltip: 'Juegos' },
  taskbarTooltip: 'Juegos',
});
