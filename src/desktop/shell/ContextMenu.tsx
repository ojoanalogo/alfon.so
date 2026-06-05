import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { EDGE_MARGIN } from '@desktop/lib/layoutConstants';

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

export default function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ x, y });

  // Clamp the menu inside the viewport once it has measured itself.
  useLayoutEffect(() => {
    const node = menuRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width - EDGE_MARGIN;
    const maxY = window.innerHeight - rect.height - EDGE_MARGIN;
    setPos({
      x: Math.max(EDGE_MARGIN, Math.min(x, maxX)),
      y: Math.max(EDGE_MARGIN, Math.min(y, maxY)),
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
    const buttons = Array.from(node.querySelectorAll<HTMLButtonElement>('button:not([disabled])'));
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
      className="fixed z-[1000] min-w-[9rem] border border-[color:var(--color-hairline-strong)] bg-[rgb(255_255_255/0.96)] p-1 font-[ui-monospace,monospace] text-[0.6875rem] text-primary shadow-[inset_0_1px_0_rgb(255_255_255/0.8),2px_3px_0_rgb(0_0_0/0.12)] backdrop-blur-[8px] dark:bg-[rgb(24_24_27/0.96)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),2px_3px_0_rgb(0_0_0/0.35)]"
      role="menu"
      tabIndex={-1}
      aria-label="Menú contextual"
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
      onKeyDown={handleMenuKeyDown}
      onContextMenu={(event) => event.preventDefault()}
    >
      {items.map((item, index) => (
        <div key={item.label}>
          {item.separatorBefore && index > 0 && (
            <span className="my-1 block h-px bg-[rgb(113_113_122/0.3)]" aria-hidden="true" />
          )}
          <button
            type="button"
            role="menuitem"
            className="block w-full cursor-pointer border border-transparent bg-transparent px-[0.6rem] py-[0.3rem] text-left font-[inherit] text-[length:inherit] text-secondary focus-visible:border-[color:var(--color-highlight-border)] focus-visible:bg-[var(--color-highlight-bg)] focus-visible:text-primary focus-visible:outline-none enabled:hover:border-[color:var(--color-highlight-border)] enabled:hover:bg-[var(--color-highlight-bg)] enabled:hover:text-primary enabled:hover:outline-none disabled:cursor-default disabled:text-muted disabled:opacity-60"
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
