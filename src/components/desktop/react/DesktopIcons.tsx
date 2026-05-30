import { useRef, useState } from 'react';
import { type DesktopIcon } from '../../../config';
import ContextMenu, { type ContextMenuItem } from './ContextMenu';
import { useResolvedIconLabelTone } from './utils/useResolvedIconLabelTone';
import { type DesktopIconsState, type IconPosition } from './useDesktopIcons';

interface DesktopIconsProps {
  state: DesktopIconsState;
  onOpenWindow: (windowId: string) => void;
  onOpenLink: (url: string) => void;
  onDesktopClick?: () => void;
}

const DRAG_THRESHOLD = 4;
const DOUBLE_CLICK_MS = 450;

interface IconDrag {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  origins: Record<string, IconPosition>;
  moved: boolean;
}

interface MarqueeDrag {
  pointerId: number;
  startX: number;
  startY: number;
  surfaceLeft: number;
  surfaceTop: number;
  moved: boolean;
}

interface MarqueeRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface MenuState {
  x: number;
  y: number;
  items: ContextMenuItem[];
}

export default function DesktopIcons({
  state,
  onOpenWindow,
  onOpenLink,
  onDesktopClick,
}: DesktopIconsProps) {
  const {
    positions,
    selected,
    deletedCount,
    visibleIcons,
    isSelected,
    selectOnly,
    toggleSelection,
    setSelection,
    clearSelection,
    moveIcons,
    deleteIcons,
    restoreAll,
  } = state;
  const iconLabelTone = useResolvedIconLabelTone();

  const [marquee, setMarquee] = useState<MarqueeRect | null>(null);
  const [menu, setMenu] = useState<MenuState | null>(null);

  const iconRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const iconDrag = useRef<IconDrag | null>(null);
  const marqueeDrag = useRef<MarqueeDrag | null>(null);
  const lastTap = useRef<{ id: string; time: number }>({ id: '', time: 0 });
  const suppressClick = useRef(false);

  function activate(icon: DesktopIcon) {
    if (icon.kind === 'link' && icon.href) {
      if (icon.external) {
        onOpenLink(icon.href);
      } else {
        window.location.assign(icon.href);
      }
      return;
    }
    if (icon.windowId) onOpenWindow(icon.windowId);
  }

  // --- Icon pointer interactions (move + click/double-click) ---------------

  function handleIconPointerDown(event: React.PointerEvent, icon: DesktopIcon) {
    if (event.button !== 0) return;
    const origins: Record<string, IconPosition> = {};
    if (selected.has(icon.id)) {
      selected.forEach((id) => {
        if (positions[id]) origins[id] = positions[id];
      });
    } else {
      origins[icon.id] = positions[icon.id];
    }
    iconDrag.current = {
      id: icon.id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origins,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleIconPointerMove(event: React.PointerEvent, icon: DesktopIcon) {
    const drag = iconDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    if (!drag.moved) {
      drag.moved = true;
      if (!selected.has(icon.id)) {
        selectOnly(icon.id);
        drag.origins = { [icon.id]: positions[icon.id] };
      }
      document.body.classList.add('is-window-gesturing');
    }
    moveIcons(drag.origins, dx, dy);
  }

  function handleIconPointerUp(event: React.PointerEvent) {
    const drag = iconDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.moved) {
      suppressClick.current = true;
      document.body.classList.remove('is-window-gesturing');
    }
    iconDrag.current = null;
  }

  function handleIconClick(event: React.MouseEvent, icon: DesktopIcon) {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    const now = event.timeStamp;
    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      toggleSelection(icon.id);
      lastTap.current = { id: icon.id, time: now };
      return;
    }
    const isDouble = lastTap.current.id === icon.id && now - lastTap.current.time < DOUBLE_CLICK_MS;
    selectOnly(icon.id);
    lastTap.current = { id: icon.id, time: now };
    if (isDouble) activate(icon);
  }

  function handleIconContextMenu(event: React.MouseEvent, icon: DesktopIcon) {
    event.preventDefault();
    event.stopPropagation();
    const targets = selected.has(icon.id) && selected.size > 1 ? Array.from(selected) : [icon.id];
    if (!selected.has(icon.id)) selectOnly(icon.id);
    const deleteLabel = targets.length > 1 ? `Eliminar (${targets.length})` : 'Eliminar';
    setMenu({
      x: event.clientX,
      y: event.clientY,
      items: [
        { label: 'Abrir', onSelect: () => activate(icon) },
        { label: deleteLabel, onSelect: () => deleteIcons(targets), separatorBefore: true },
      ],
    });
  }

  // --- Desktop surface interactions (marquee + empty context menu) ---------

  function handleSurfacePointerDown(event: React.PointerEvent) {
    if (event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    marqueeDrag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      surfaceLeft: rect.left,
      surfaceTop: rect.top,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleSurfacePointerMove(event: React.PointerEvent) {
    const drag = marqueeDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    drag.moved = true;

    const left = Math.min(drag.startX, event.clientX);
    const top = Math.min(drag.startY, event.clientY);
    const right = Math.max(drag.startX, event.clientX);
    const bottom = Math.max(drag.startY, event.clientY);

    setMarquee({
      left: left - drag.surfaceLeft,
      top: top - drag.surfaceTop,
      width: right - left,
      height: bottom - top,
    });

    const hits: string[] = [];
    iconRefs.current.forEach((node, id) => {
      const r = node.getBoundingClientRect();
      const intersects = !(r.right < left || r.left > right || r.bottom < top || r.top > bottom);
      if (intersects) hits.push(id);
    });
    setSelection(hits);
  }

  function handleSurfacePointerUp(event: React.PointerEvent) {
    const drag = marqueeDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.moved) {
      clearSelection();
      onDesktopClick?.();
    }
    marqueeDrag.current = null;
    setMarquee(null);
  }

  function handleSurfaceContextMenu(event: React.MouseEvent) {
    event.preventDefault();
    setMenu({
      x: event.clientX,
      y: event.clientY,
      items: [
        { label: 'Actualizar', onSelect: () => clearSelection() },
        {
          label: 'Restaurar iconos',
          onSelect: () => restoreAll(),
          disabled: deletedCount === 0,
          separatorBefore: true,
        },
      ],
    });
  }

  function registerIconRef(id: string, node: HTMLButtonElement | null) {
    if (node) iconRefs.current.set(id, node);
    else iconRefs.current.delete(id);
  }

  return (
    <>
      <div
        className="desktop-surface"
        onPointerDown={handleSurfacePointerDown}
        onPointerMove={handleSurfacePointerMove}
        onPointerUp={handleSurfacePointerUp}
        onPointerCancel={handleSurfacePointerUp}
        onContextMenu={handleSurfaceContextMenu}
      />

      <div
        className={['desktop-icons', `desktop-icons--labels-${iconLabelTone}`].join(' ')}
        aria-label="Iconos de escritorio"
      >
        {visibleIcons.map((icon) => {
          const pos = positions[icon.id] ?? { x: 0, y: 0 };
          return (
            <button
              key={icon.id}
              ref={(node) => registerIconRef(icon.id, node)}
              type="button"
              className={['desktop-icon', isSelected(icon.id) && 'is-selected']
                .filter(Boolean)
                .join(' ')}
              style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
              title={icon.tooltip}
              aria-label={icon.tooltip ?? icon.label}
              aria-pressed={isSelected(icon.id)}
              onPointerDown={(event) => handleIconPointerDown(event, icon)}
              onPointerMove={(event) => handleIconPointerMove(event, icon)}
              onPointerUp={handleIconPointerUp}
              onPointerCancel={handleIconPointerUp}
              onClick={(event) => handleIconClick(event, icon)}
              onContextMenu={(event) => handleIconContextMenu(event, icon)}
            >
              <span className="desktop-icon__graphic" aria-hidden="true">
                <img src={icon.iconSrc} alt="" width={48} height={48} loading="lazy" decoding="async" />
              </span>
              <span className="desktop-icon__label">{icon.label}</span>
            </button>
          );
        })}
      </div>

      {marquee && (
        <div
          className="desktop-marquee"
          aria-hidden="true"
          style={{
            left: `${marquee.left}px`,
            top: `${marquee.top}px`,
            width: `${marquee.width}px`,
            height: `${marquee.height}px`,
          }}
        />
      )}

      {menu && (
        <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={() => setMenu(null)} />
      )}
    </>
  );
}
