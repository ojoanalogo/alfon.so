import { useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { SITE_TITLE } from '@/config';
import ContextMenu, { type ContextMenuItem } from '../ContextMenu';
import StartMenu from '../startmenu/StartMenu';
import FullscreenToggle from '../FullscreenToggle';
import ThemeToggle from '../ThemeToggle';
import TaskbarClock from './TaskbarClock';
import type { DesktopIcon } from '@/config';
import type { WindowMeta, WindowState } from '../../types';

const CHIP =
  'inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border-0 px-2 font-[inherit] text-[0.6875rem] transition-colors duration-150 hover:outline-none focus-visible:outline-none';
const CHIP_IDLE =
  'bg-transparent text-secondary hover:bg-[var(--color-highlight-bg)] hover:text-primary focus-visible:bg-[var(--color-highlight-bg)] focus-visible:text-primary';
const CHIP_ACTIVE = 'bg-[var(--color-highlight-bg-strong)] text-primary';

interface TaskbarProps {
  windows: Record<string, WindowState>;
  order: string[];
  focusedId: string | null;
  meta: Record<string, WindowMeta>;
  startMenuApps: DesktopIcon[];
  onSelect: (id: string) => void;
  onMinimize: (id: string) => void;
  onClose: (id: string) => void;
  onOpenExternal: (url: string) => void;
  onOpenWindow: (id: string) => void;
  onCloseAllWindows: () => void;
}

interface MenuState {
  x: number;
  y: number;
  items: ContextMenuItem[];
}

export default function Taskbar({
  windows,
  order,
  focusedId,
  meta,
  startMenuApps,
  onSelect,
  onMinimize,
  onClose,
  onOpenExternal,
  onOpenWindow,
  onCloseAllWindows,
}: TaskbarProps) {
  const openWindows = order.map((id) => windows[id]).filter((win) => win && win.open);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [startOpen, setStartOpen] = useState(false);
  const startRef = useRef<HTMLButtonElement>(null);

  function toggleStartMenu() {
    setMenu(null);
    setStartOpen((open) => !open);
  }

  function openWindowMenu(event: React.MouseEvent, win: WindowState) {
    event.preventDefault();
    setStartOpen(false);
    setMenu({
      x: event.clientX,
      y: event.clientY,
      items: [
        win.minimized
          ? { label: 'Restaurar', onSelect: () => onSelect(win.id) }
          : { label: 'Minimizar', onSelect: () => onMinimize(win.id) },
        { label: 'Cerrar', onSelect: () => onClose(win.id), separatorBefore: true },
      ],
    });
  }

  return (
    <footer
      className="desktop-taskbar fixed right-0 bottom-0 left-0 z-[100] flex flex-col border-t border-gray-300/50 bg-[color-mix(in_srgb,var(--color-surface)_78%,transparent)] font-mono text-xs shadow-[inset_0_1px_0_rgb(255_255_255/0.45)] backdrop-blur-lg dark:border-gray-600/40 dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]"
      aria-label="Barra de tareas"
    >
      <div className="flex h-[2.5rem] items-center justify-between gap-3 pr-[max(0.75rem,env(safe-area-inset-right,0px))] pl-[max(0.75rem,env(safe-area-inset-left,0px))] max-sm:gap-1.5 max-sm:pr-[max(0.5rem,env(safe-area-inset-right,0px))] max-sm:pl-[max(0.5rem,env(safe-area-inset-left,0px))]">
        <div className="flex min-w-0 flex-1 items-center gap-2 max-sm:gap-1.5">
          <button
            ref={startRef}
            type="button"
            className={[CHIP, 'px-2.5 max-sm:px-2', startOpen ? CHIP_ACTIVE : CHIP_IDLE]
              .filter(Boolean)
              .join(' ')}
            aria-haspopup="menu"
            aria-expanded={startOpen}
            title="Menú de inicio"
            onClick={toggleStartMenu}
          >
            <span className="leading-none whitespace-nowrap">{SITE_TITLE}</span>
          </button>

          <div
            className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto max-sm:gap-0.5"
            aria-label="Ventanas abiertas"
          >
            {openWindows.map((win) => {
              const item = meta[win.id];
              if (!item) return null;
              const isWinFocused = focusedId === win.id && !win.minimized;
              const className = [
                CHIP,
                'max-w-[11rem] overflow-hidden max-sm:max-w-[2.25rem] max-sm:px-1',
                isWinFocused ? CHIP_ACTIVE : CHIP_IDLE,
                win.minimized && 'opacity-60',
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <button
                  key={win.id}
                  type="button"
                  className={className}
                  data-taskbar-window={win.id}
                  data-focused={isWinFocused}
                  data-minimized={win.minimized}
                  title={item.tooltip ?? item.label}
                  onClick={() => onSelect(win.id)}
                  onContextMenu={(event) => openWindowMenu(event, win)}
                >
                  <img
                    src={item.iconSrc}
                    alt=""
                    width={16}
                    height={16}
                    className="h-4 w-4 shrink-0 object-contain [image-rendering:pixelated]"
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap max-sm:hidden">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5" aria-label="Bandeja del sistema">
          <FullscreenToggle className="shrink-0" />
          <ThemeToggle className="shrink-0" />
          <TaskbarClock />
        </div>
      </div>

      <AnimatePresence>
        {startOpen && (
          <StartMenu
            anchorRef={startRef}
            apps={startMenuApps}
            onClose={() => setStartOpen(false)}
            onOpenExternal={onOpenExternal}
            onOpenWindow={onOpenWindow}
            onCloseAllWindows={onCloseAllWindows}
          />
        )}
      </AnimatePresence>

      {menu && (
        <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={() => setMenu(null)} />
      )}
      <div
        className="desktop-taskbar__safe-area h-[var(--safe-area-bottom)] shrink-0"
        aria-hidden
      />
    </footer>
  );
}
