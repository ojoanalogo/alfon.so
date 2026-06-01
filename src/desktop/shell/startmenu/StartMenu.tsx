import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { NAV_LINKS, SITE_TITLE, SOCIAL_LINKS, type DesktopIcon, type NavLink } from '@/config';

export interface StartMenuProps {
  anchorRef: RefObject<HTMLElement | null>;
  apps: DesktopIcon[];
  onClose: () => void;
  onOpenExternal: (url: string) => void;
  onOpenWindow: (id: string) => void;
  onCloseAllWindows: () => void;
}

const VIEWPORT_MARGIN = 8;
const TASKBAR_HEIGHT = 40;

const MENU_SECTION = 'px-[0.375rem]';
const MENU_SECTION_TITLE =
  'm-0 mb-[0.125rem] px-[0.375rem] py-[0.125rem] text-[0.5625rem] font-semibold tracking-[0.08em] uppercase text-muted';
const MENU_LIST = 'm-0 list-none p-0';
const MENU_ITEM =
  'flex w-full cursor-pointer items-center gap-2 border border-transparent bg-transparent px-2 py-[0.3rem] text-left font-[inherit] text-[length:inherit] text-secondary hover:border-[color:var(--color-highlight-border)] hover:bg-[var(--color-highlight-bg)] hover:text-primary hover:outline-none focus-visible:border-[color:var(--color-highlight-border)] focus-visible:bg-[var(--color-highlight-bg)] focus-visible:text-primary focus-visible:outline-none';
const MENU_GLYPH = 'inline-flex w-4 shrink-0 justify-center text-[0.625rem] text-muted';

function navigateLink(link: NavLink, onOpenExternal: (url: string) => void) {
  if (link.url) {
    window.location.assign(link.url);
  } else if (link.redirect) {
    onOpenExternal(link.redirect);
  }
}

export default function StartMenu({
  anchorRef,
  apps,
  onClose,
  onOpenExternal,
  onOpenWindow,
  onCloseAllWindows,
}: StartMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState({ left: 0, bottom: TASKBAR_HEIGHT });
  const prefersReduced = useReducedMotion();

  const reposition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const menu = menuRef.current;
    let left = rect.left;
    if (menu) {
      const menuWidth = menu.offsetWidth;
      const maxLeft = window.innerWidth - menuWidth - VIEWPORT_MARGIN;
      left = Math.max(VIEWPORT_MARGIN, Math.min(left, maxLeft));
    }
    setPosition({ left, bottom: window.innerHeight - rect.top + 4 });
  }, [anchorRef]);

  useLayoutEffect(() => {
    reposition();
  }, [reposition]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      onClose();
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    }
    window.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('resize', reposition);
    };
  }, [anchorRef, onClose, reposition]);

  useEffect(() => {
    const first = menuRef.current?.querySelector<HTMLButtonElement>('button:not([disabled])');
    first?.focus();
  }, []);

  function run(action: () => void) {
    action();
    onClose();
  }

  // Mirrors the window "genie" minimize: the menu collapses into / springs out of
  // the taskbar button (its bottom-left corner) with the same easing curve.
  const variants: Variants = {
    collapsed: {
      opacity: 0,
      scaleX: 0.12,
      scaleY: 0.02,
      transition: prefersReduced ? { duration: 0 } : { duration: 0.42, ease: [0.4, 0.05, 0.25, 1] },
    },
    open: {
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      transition: prefersReduced ? { duration: 0 } : { duration: 0.42, ease: [0.4, 0.05, 0.25, 1] },
    },
  };

  return (
    <motion.div
      ref={menuRef}
      className="fixed z-[110] flex w-[min(16.5rem,calc(100vw-1rem))] flex-col border border-[color:var(--color-hairline-strong)] bg-[rgb(255_255_255/0.96)] font-[ui-monospace,monospace] text-[0.6875rem] text-primary shadow-[inset_0_1px_0_rgb(255_255_255/0.8),2px_3px_0_rgb(0_0_0/0.12)] backdrop-blur-[8px] dark:bg-[rgb(24_24_27/0.96)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),2px_3px_0_rgb(0_0_0/0.35)] max-sm:w-[min(18rem,calc(100vw-0.75rem))] max-sm:max-h-[min(24rem,calc(100dvh-4rem))]"
      role="menu"
      aria-label="Menú de inicio"
      style={{
        left: `${position.left}px`,
        bottom: `${position.bottom}px`,
        transformOrigin: 'bottom left',
      }}
      variants={variants}
      initial="collapsed"
      animate="open"
      exit="collapsed"
      onContextMenu={(event) => event.preventDefault()}
    >
      <header className="flex items-center gap-[0.625rem] border-b border-[rgb(113_113_122/0.3)] bg-[linear-gradient(180deg,rgb(113_113_122/0.16)_0%,rgb(113_113_122/0.06)_100%)] px-3 py-[0.625rem] dark:bg-[linear-gradient(180deg,rgb(161_161_170/0.12)_0%,rgb(24_24_27/0.4)_100%)]">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-[color:var(--color-hairline)] bg-[var(--color-control-fill)] text-[1.125rem] leading-none dark:bg-[rgb(9_9_11/0.65)]" aria-hidden="true">
          🧐
        </span>
        <div className="flex min-w-0 flex-col gap-[0.125rem]">
          <span className="text-[0.8125rem] font-semibold text-primary">{SITE_TITLE}</span>
          <span className="overflow-hidden text-[0.5625rem] text-muted text-ellipsis whitespace-nowrap">guest@alfon.so · devfolio v1.0</span>
        </div>
      </header>

      <div className="flex max-h-[min(22rem,calc(100dvh-8rem))] flex-col gap-[0.375rem] overflow-y-auto py-[0.375rem] max-sm:max-h-[min(18rem,calc(100dvh-7rem))]">
        <section className={MENU_SECTION} aria-label="Programas">
          <h3 className={MENU_SECTION_TITLE}>programas</h3>
          <ul className={MENU_LIST} role="none">
            {apps.map((icon) => (
              <li key={icon.id} role="none">
                <button
                  type="button"
                  role="menuitem"
                  className={MENU_ITEM}
                  onClick={() => run(() => onOpenWindow(icon.windowId!))}
                >
                  <img
                    src={icon.iconSrc}
                    alt=""
                    width={16}
                    height={16}
                    className="shrink-0 object-contain [image-rendering:pixelated]"
                    loading="lazy"
                    decoding="async"
                  />
                  <span>{icon.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className={MENU_SECTION} aria-label="Enlaces">
          <h3 className={MENU_SECTION_TITLE}>enlaces</h3>
          <ul className={MENU_LIST} role="none">
            {NAV_LINKS.map((link) => (
              <li key={link.title} role="none">
                <button
                  type="button"
                  role="menuitem"
                  className={MENU_ITEM}
                  onClick={() => run(() => navigateLink(link, onOpenExternal))}
                >
                  <span className={MENU_GLYPH} aria-hidden="true">
                    ↗
                  </span>
                  <span>{link.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className={MENU_SECTION} aria-label="Red">
          <h3 className={MENU_SECTION_TITLE}>red</h3>
          <ul className={MENU_LIST} role="none">
            {SOCIAL_LINKS.map((link) => (
              <li key={link.platform} role="none">
                <button
                  type="button"
                  role="menuitem"
                  className={MENU_ITEM}
                  onClick={() => run(() => onOpenExternal(link.url))}
                >
                  <span className={MENU_GLYPH} aria-hidden="true">
                    @
                  </span>
                  <span>{link.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <footer
        className="border-t border-t-[rgb(113_113_122/0.3)] p-[0.375rem]"
        aria-label="Sistema"
      >
        <button
          type="button"
          role="menuitem"
          className="block w-full cursor-pointer border border-[color:var(--color-hairline)] bg-[var(--color-control-fill)] px-1 py-[0.35rem] font-[inherit] text-[0.5625rem] leading-[1.2] text-secondary hover:border-[color:var(--color-highlight-border)] hover:bg-[var(--color-highlight-bg)] hover:text-primary hover:outline-none focus-visible:border-[color:var(--color-highlight-border)] focus-visible:bg-[var(--color-highlight-bg)] focus-visible:text-primary focus-visible:outline-none dark:bg-[rgb(9_9_11/0.65)]"
          onClick={() => run(onCloseAllWindows)}
        >
          cerrar ventanas
        </button>
      </footer>
    </motion.div>
  );
}
