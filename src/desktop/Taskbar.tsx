import { useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { SITE_TITLE } from '@/config';
import ContextMenu, { type ContextMenuItem } from './ContextMenu';
import StartMenu from './StartMenu';
import ThemeToggle from './ThemeToggle';
import TaskbarClock from './ui/TaskbarClock';
import type { DesktopIcon } from '@/config';
import type { WindowState } from './types';

export interface WindowMeta {
  iconSrc: string;
  label: string;
  tooltip?: string;
}

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
      className="fixed right-0 bottom-0 left-0 z-[100] flex h-[2.5rem] items-center gap-[0.75rem] justify-between border-t border-[color:var(--color-hairline)] bg-[rgb(255_255_255/0.75)] px-[0.75rem] font-[ui-monospace,monospace] text-[0.75rem] backdrop-blur-[12px] dark:bg-[rgb(9_9_11/0.85)] max-sm:gap-[0.375rem] max-sm:px-[0.5rem]"
      aria-label="Barra de tareas"
    >
      <div className="flex min-w-0 flex-1 items-center gap-[0.75rem] max-sm:gap-[0.375rem]">
        <button
          ref={startRef}
          type="button"
          className={[
            'flex shrink-0 cursor-pointer items-center gap-[0.375rem] border px-[0.45rem] py-[0.2rem] font-[inherit] text-[length:inherit] hover:border-[color:var(--color-hairline)] hover:bg-[rgb(255_255_255/0.08)] hover:text-primary hover:outline-none focus-visible:border-[color:var(--color-hairline)] focus-visible:bg-[rgb(255_255_255/0.08)] focus-visible:text-primary focus-visible:outline-none dark:hover:bg-[rgb(255_255_255/0.06)] dark:focus-visible:bg-[rgb(255_255_255/0.06)] max-sm:px-[0.4rem] max-sm:py-[0.2rem]',
            startOpen
              ? 'border-[color:var(--color-highlight-border)] bg-[var(--color-highlight-bg)] text-primary'
              : 'border-transparent bg-transparent text-secondary',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-haspopup="menu"
          aria-expanded={startOpen}
          title="Menú de inicio"
          onClick={toggleStartMenu}
        >
          <span
            className={`w-[0.75rem] shrink-0 text-center text-[0.6875rem] leading-none max-sm:text-[1.125rem] ${startOpen ? 'text-primary' : 'text-muted'}`}
            aria-hidden="true"
          >
            ▣
          </span>
          <span className="text-[0.6875rem] leading-none whitespace-nowrap max-sm:hidden">
            {SITE_TITLE}
          </span>
        </button>

        <div
          className="flex min-w-0 flex-1 items-center gap-[0.375rem] overflow-x-auto max-sm:gap-[0.25rem]"
          aria-label="Ventanas abiertas"
        >
          {openWindows.map((win) => {
            const item = meta[win.id];
            if (!item) return null;
            const isWinFocused = focusedId === win.id && !win.minimized;
            const className = [
              'inline-flex max-w-[11rem] cursor-pointer items-center gap-[0.375rem] overflow-hidden border px-2 py-[0.2rem] font-[inherit] text-[0.6875rem] hover:border-[color:var(--color-highlight-border)] hover:text-primary max-sm:max-w-[2.25rem] max-sm:p-1',
              isWinFocused
                ? 'border-[color:var(--color-highlight-border)] bg-[var(--color-highlight-bg)] text-primary'
                : 'border-[color:var(--color-hairline)] bg-[var(--color-control-fill)] text-secondary dark:bg-[rgb(24_24_27/0.75)]',
              win.minimized && 'opacity-[0.72]',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <button
                key={win.id}
                type="button"
                className={className}
                data-taskbar-window={win.id}
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

      <div
        className="flex shrink-0 items-center gap-[0.125rem] border-l border-l-[rgb(113_113_122/0.25)] pl-2 max-sm:pl-[0.375rem]"
        aria-label="Bandeja del sistema"
      >
        <ThemeToggle className="shrink-0" />
        <TaskbarClock />
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
    </footer>
  );
}
