import { useRef, useState } from 'react';
import ContextMenu, { type ContextMenuItem } from './ContextMenu';
import StartMenu from './StartMenu';
import ThemeToggle from './ThemeToggle';
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
    <footer className="desktop-taskbar" aria-label="Barra de tareas">
      <button
        ref={startRef}
        type="button"
        className={['desktop-taskbar__start', startOpen && 'is-active'].filter(Boolean).join(' ')}
        aria-haspopup="menu"
        aria-expanded={startOpen}
        title="Menú de inicio"
        onClick={toggleStartMenu}
      >
        <span aria-hidden="true">▣</span>
        <span>alfon.so</span>
      </button>
      <div className="desktop-taskbar__windows" aria-label="Ventanas abiertas">
        {openWindows.map((win) => {
          const item = meta[win.id];
          if (!item) return null;
          const className = [
            'desktop-taskbar__window',
            focusedId === win.id && !win.minimized && 'is-focused',
            win.minimized && 'is-minimized',
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
                className="desktop-taskbar__window-icon"
                loading="lazy"
                decoding="async"
              />
              <span className="desktop-taskbar__window-label">{item.label}</span>
            </button>
          );
        })}
      </div>
      <ThemeToggle />

      {startOpen && startRef.current && (
        <StartMenu
          anchor={startRef.current}
          onClose={() => setStartOpen(false)}
          onOpenExternal={onOpenExternal}
          onOpenWindow={onOpenWindow}
          onCloseAllWindows={onCloseAllWindows}
        />
      )}

      {menu && (
        <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={() => setMenu(null)} />
      )}
    </footer>
  );
}
