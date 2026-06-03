import type { ReactNode } from 'react';
import { defineApp, type DefineAppInput } from '../defineApp';
import type { WindowChromeProps } from '../types';

type GameAppInput<Id extends string> = Omit<DefineAppInput<Id>, 'body'> & {
  body: (props: { active: boolean }) => ReactNode;
};

function isGameActive(win?: WindowChromeProps): boolean {
  return Boolean(win?.focused && win.state.open && !win.state.minimized);
}

/** Game window helper — pauses input and loops when unfocused, minimized, or closed. */
export function gameApp<Id extends string>(input: GameAppInput<Id>) {
  const { body, ...meta } = input;
  return defineApp({
    ...meta,
    body: (_ctx, win) => body({ active: isGameActive(win) }),
  });
}
