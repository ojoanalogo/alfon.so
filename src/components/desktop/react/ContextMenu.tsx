import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface ContextMenuItem {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  /** Draw a divider above this item. */
  separatorBefore?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

const VIEWPORT_MARGIN = 8;

export default function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ x, y });

  // Clamp the menu inside the viewport once it has measured itself.
  useLayoutEffect(() => {
    const node = menuRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width - VIEWPORT_MARGIN;
    const maxY = window.innerHeight - rect.height - VIEWPORT_MARGIN;
    setPos({
      x: Math.max(VIEWPORT_MARGIN, Math.min(x, maxX)),
      y: Math.max(VIEWPORT_MARGIN, Math.min(y, maxY)),
    });
  }, [x, y, items]);

  // Focus the first enabled item for keyboard navigation.
  useEffect(() => {
    const node = menuRef.current;
    if (!node) return;
    const first = node.querySelector<HTMLButtonElement>('button:not([disabled])');
    first?.focus();
  }, []);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) onClose();
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    }
    function handleScroll() {
      onClose();
    }
    window.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    window.addEventListener('blur', handleScroll);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
      window.removeEventListener('blur', handleScroll);
    };
  }, [onClose]);

  const moveFocus = useCallback((delta: number) => {
    const node = menuRef.current;
    if (!node) return;
    const buttons = Array.from(
      node.querySelectorAll<HTMLButtonElement>('button:not([disabled])'),
    );
    if (buttons.length === 0) return;
    const active = document.activeElement as HTMLElement | null;
    const currentIndex = buttons.findIndex((button) => button === active);
    const nextIndex = (currentIndex + delta + buttons.length) % buttons.length;
    buttons[nextIndex]?.focus();
  }, []);

  function handleMenuKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveFocus(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveFocus(-1);
    }
  }

  return (
    <div
      ref={menuRef}
      className="desktop-context-menu"
      role="menu"
      aria-label="Menú contextual"
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
      onKeyDown={handleMenuKeyDown}
      onContextMenu={(event) => event.preventDefault()}
    >
      {items.map((item, index) => (
        <div key={item.label} className="desktop-context-menu__row">
          {item.separatorBefore && index > 0 && (
            <span className="desktop-context-menu__separator" aria-hidden="true" />
          )}
          <button
            type="button"
            role="menuitem"
            className="desktop-context-menu__item"
            disabled={item.disabled}
            onClick={() => {
              item.onSelect();
              onClose();
            }}
          >
            {item.label}
          </button>
        </div>
      ))}
    </div>
  );
}
