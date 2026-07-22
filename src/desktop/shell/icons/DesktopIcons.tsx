import { useRef, useState, type RefObject } from 'react';
import { type DesktopIcon } from '@/config';
import ContextMenu, { type ContextMenuItem } from '../ContextMenu';
import { useResolvedIconLabelTone } from '../../lib/useResolvedIconLabelTone';
import { type DesktopIconsState, type IconPosition } from '../../state/useDesktopIcons';
import { iconGlyphDragTransform } from './iconDragTransform';
import { useDesktopIconDrag } from './useDesktopIconDrag';
import { useMarqueeSelection } from './useMarqueeSelection';
import { STATE_CLASS } from '../../lib/stateClasses';

interface DesktopIconsProps {
  state: DesktopIconsState;
  onOpenWindow: (windowId: string) => void;
  onDesktopClick?: () => void;
  trashRef: RefObject<HTMLElement | null>;
  suppressTrashClickRef: RefObject<boolean>;
}

const DOUBLE_CLICK_MS = 450;

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

  const [menu, setMenu] = useState<MenuState | null>(null);

  const iconRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
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

  const { marquee, surfaceHandlers } = useMarqueeSelection({
    iconRefs,
    setSelection,
    clearSelection,
    onDesktopClick,
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
      // A selection toggle is not a "tap": recording it would make a plain
      // click within DOUBLE_CLICK_MS misread as a double-click and open the app.
      lastTap.current = { id: '', time: 0 };
      return;
    }
    const isDouble = lastTap.current.id === icon.id && now - lastTap.current.time < DOUBLE_CLICK_MS;
    selectOnly(icon.id);
    lastTap.current = { id: icon.id, time: now };
    if (isDouble) activate(icon);
  }

  function handleIconKeyDown(event: React.KeyboardEvent, icon: DesktopIcon) {
    // Enter opens the focused icon (preventDefault suppresses the synthesized
    // click so it doesn't also run the double-click selection path).
    if (event.key === 'Enter') {
      event.preventDefault();
      selectOnly(icon.id);
      activate(icon);
    }
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

  // --- Desktop surface interactions (empty-area context menu) ---------------

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
        {...surfaceHandlers}
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
                isSelected(icon.id) && STATE_CLASS.selected,
                isDragging && STATE_CLASS.iconDragging,
              ]
                .filter(Boolean)
                .join(' ')}
              style={{
                left: `${pos.x}px`,
                top: `${pos.y}px`,
              }}
              title={icon.tooltip}
              data-icon-id={icon.id}
              aria-label={icon.tooltip ?? icon.label}
              aria-pressed={isSelected(icon.id)}
              onPointerDown={(event) => handleIconPointerDown(event, icon)}
              onClick={(event) => handleIconClick(event, icon)}
              onKeyDown={(event) => handleIconKeyDown(event, icon)}
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
                    className="h-full w-full object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)] [image-rendering:pixelated]"
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
          className="desktop-selection-marquee"
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
