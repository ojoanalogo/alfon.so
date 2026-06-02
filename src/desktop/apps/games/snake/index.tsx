import { createElement } from 'react';
import { gameApp } from '../gameApp';
import SnakeGame from './SnakeGame';

export default gameApp({
  id: 'snake',
  title: 'snake',
  iconKey: 'games',
  geometry: { defaultX: 220, defaultY: 96, defaultWidth: 360, defaultHeight: 420, initialZ: 15 },
  desktopIcon: false,
  taskbarTooltip: 'Snake',
  bodyClassName: 'snake-window__body',
  body: ({ active }) => createElement(SnakeGame, { active }),
});
