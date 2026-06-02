import { createElement } from 'react';
import { gameApp } from '../gameApp';
import PlaneGame from './PlaneGame';

export default gameApp({
  id: 'plane',
  title: 'plane',
  iconKey: 'games',
  geometry: { defaultX: 260, defaultY: 88, defaultWidth: 360, defaultHeight: 480, initialZ: 15 },
  desktopIcon: false,
  taskbarTooltip: 'Plane',
  bodyClassName: 'snake-window__body',
  body: ({ active }) => createElement(PlaneGame, { active }),
});
