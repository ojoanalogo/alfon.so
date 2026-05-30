import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { DESKTOP_ICONS, NAV_LINKS, SITE_TITLE, SOCIAL_LINKS, type NavLink } from '../../../config';

export interface StartMenuProps {
  anchor: HTMLElement;
  onClose: () => void;
  onOpenExternal: (url: string) => void;
  onOpenWindow: (id: string) => void;
  onCloseAllWindows: () => void;
}

const VIEWPORT_MARGIN = 8;
const TASKBAR_HEIGHT = 40;

function navigateLink(link: NavLink, onOpenExternal: (url: string) => void) {
  if (link.url) {
    window.location.assign(link.url);
  } else if (link.redirect) {
    onOpenExternal(link.redirect);
  }
}

export default function StartMenu({
  anchor,
  onClose,
  onOpenExternal,
  onOpenWindow,
  onCloseAllWindows,
}: StartMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const posRef = useRef({ left: 0, bottom: TASKBAR_HEIGHT });

  const apps = DESKTOP_ICONS.filter((icon) => icon.kind === 'window' && icon.windowId);

  const reposition = useCallback(() => {
    const rect = anchor.getBoundingClientRect();
    const menu = menuRef.current;
    let left = rect.left;
    if (menu) {
      const menuWidth = menu.offsetWidth;
      const maxLeft = window.innerWidth - menuWidth - VIEWPORT_MARGIN;
      left = Math.max(VIEWPORT_MARGIN, Math.min(left, maxLeft));
    }
    posRef.current = { left, bottom: window.innerHeight - rect.top + 4 };
    if (menu) {
      menu.style.left = `${left}px`;
      menu.style.bottom = `${posRef.current.bottom}px`;
    }
  }, [anchor]);

  useLayoutEffect(() => {
    reposition();
  }, [reposition]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || anchor.contains(target)) return;
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
  }, [anchor, onClose, reposition]);

  useEffect(() => {
    const first = menuRef.current?.querySelector<HTMLButtonElement>('button:not([disabled])');
    first?.focus();
  }, []);

  function run(action: () => void) {
    action();
    onClose();
  }

  return (
    <div
      ref={menuRef}
      className="start-menu"
      role="menu"
      aria-label="Menú de inicio"
      style={{ left: `${posRef.current.left}px`, bottom: `${posRef.current.bottom}px` }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <header className="start-menu__header">
        <span className="start-menu__logo" aria-hidden="true">
          ▣
        </span>
        <div className="start-menu__brand">
          <span className="start-menu__title">{SITE_TITLE}</span>
          <span className="start-menu__subtitle">guest@alfon.so · devfolio v1.0</span>
        </div>
      </header>

      <div className="start-menu__body">
        <section className="start-menu__section" aria-label="Programas">
          <h3 className="start-menu__section-title">programas</h3>
          <ul className="start-menu__list" role="none">
            {apps.map((icon) => (
              <li key={icon.id} role="none">
                <button
                  type="button"
                  role="menuitem"
                  className="start-menu__item"
                  onClick={() => run(() => onOpenWindow(icon.windowId!))}
                >
                  <img
                    src={icon.iconSrc}
                    alt=""
                    width={16}
                    height={16}
                    className="start-menu__item-icon"
                    loading="lazy"
                    decoding="async"
                  />
                  <span>{icon.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="start-menu__section" aria-label="Enlaces">
          <h3 className="start-menu__section-title">enlaces</h3>
          <ul className="start-menu__list" role="none">
            {NAV_LINKS.map((link) => (
              <li key={link.title} role="none">
                <button
                  type="button"
                  role="menuitem"
                  className="start-menu__item"
                  onClick={() => run(() => navigateLink(link, onOpenExternal))}
                >
                  <span className="start-menu__item-glyph" aria-hidden="true">
                    ↗
                  </span>
                  <span>{link.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="start-menu__section" aria-label="Red">
          <h3 className="start-menu__section-title">red</h3>
          <ul className="start-menu__list" role="none">
            {SOCIAL_LINKS.map((link) => (
              <li key={link.platform} role="none">
                <button
                  type="button"
                  role="menuitem"
                  className="start-menu__item"
                  onClick={() => run(() => onOpenExternal(link.url))}
                >
                  <span className="start-menu__item-glyph" aria-hidden="true">
                    @
                  </span>
                  <span>{link.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <footer className="start-menu__footer" aria-label="Sistema">
        <button
          type="button"
          role="menuitem"
          className="start-menu__action"
          onClick={() => run(onCloseAllWindows)}
        >
          cerrar ventanas
        </button>
      </footer>
    </div>
  );
}
