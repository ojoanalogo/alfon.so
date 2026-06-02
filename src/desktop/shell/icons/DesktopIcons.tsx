import { useRef, useState, type RefObject } from 'react';
import { type DesktopIcon } from '@/config';
import ContextMenu, { type ContextMenuItem } from '../ContextMenu';
import { useResolvedIconLabelTone } from '../../lib/useResolvedIconLabelTone';
import { type DesktopIconsState, type IconPosition } from '../../state/useDesktopIcons';
import { iconGlyphDragTransform } from './iconDragTransform';
import { useDesktopIconDrag } from './useDesktopIconDrag';

interface DesktopIconsProps {
  state: DesktopIconsState;
  onOpenWindow: (windowId: string) => void;
  onDesktopClick?: () => void;
  trashRef: RefObject<HTMLElement | null>;
  suppressTrashClickRef: RefObject<boolean>;
}

const DRAG_THRESHOLD = 4;
const DOUBLE_CLICK_MS = 450;

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
  onDesktopClick,
  trashRef,
  suppressTrashClickRef,
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
  const marqueeDrag = useRef<MarqueeDrag | null>(null);
  const lastTap = useRef<{ id: string; time: number }>({ id: '', time: 0 });

  const {
    visual: dragVisual,
    startDrag,
    consumeSuppressedClick,
  } = useDesktopIconDrag({
    positions,
    selected,
    selectOnly,
    moveIcons,
    deleteIcons,
    trashRef,
    suppressTrashClickRef,
  });

  function activate(icon: DesktopIcon) {
    if (icon.windowId) onOpenWindow(icon.windowId);
  }

  // --- Icon pointer interactions (move + click/double-click) ---------------

  function handleIconPointerDown(event: React.PointerEvent, icon: DesktopIcon) {
    const origins: Record<string, IconPosition> = {};
    if (selected.has(icon.id)) {
      selected.forEach((id) => {
        if (positions[id]) origins[id] = positions[id];
      });
    } else if (positions[icon.id]) {
      origins[icon.id] = positions[icon.id];
    }
    startDrag(event, icon.id, origins);
  }

  function handleIconClick(event: React.MouseEvent, icon: DesktopIcon) {
    if (consumeSuppressedClick()) return;
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
        className="absolute inset-0 z-[1] touch-none"
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
          const isDragging = dragVisual.draggingIds.has(icon.id);
          return (
            <button
              key={icon.id}
              ref={(node) => registerIconRef(icon.id, node)}
              type="button"
              className={[
                'desktop-icon',
                isSelected(icon.id) && 'is-selected',
                isDragging && 'is-dragging',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{
                left: `${pos.x}px`,
                top: `${pos.y}px`,
              }}
              title={icon.tooltip}
              aria-label={icon.tooltip ?? icon.label}
              aria-pressed={isSelected(icon.id)}
              onPointerDown={(event) => handleIconPointerDown(event, icon)}
              onClick={(event) => handleIconClick(event, icon)}
              onContextMenu={(event) => handleIconContextMenu(event, icon)}
            >
              <span className="desktop-icon__body">
                <span
                  className="desktop-icon__glyph h-8 w-8 max-sm:h-12 max-sm:w-12"
                  aria-hidden="true"
                  style={
                    isDragging
                      ? {
                          transform: iconGlyphDragTransform(
                            dragVisual.tiltX,
                            dragVisual.tiltY,
                            dragVisual.ramp,
                          ),
                        }
                      : undefined
                  }
                >
                  <img
                    src={icon.iconSrc}
                    alt=""
                    width={48}
                    height={48}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-contain [image-rendering:pixelated]"
                  />
                </span>
                <span className="desktop-icon__label w-full max-w-[6.75rem] px-1 py-[0.125rem] text-[0.625rem] leading-[1.25] [overflow-wrap:anywhere] [word-break:normal] hyphens-auto max-sm:max-w-[5.5rem] max-sm:text-[0.6875rem] max-sm:leading-[1.25]">
                  {icon.label}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {marquee && (
        <div
          className="pointer-events-none absolute z-[6] border border-[color:var(--color-highlight-border)] bg-[var(--color-highlight-bg)]"
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
