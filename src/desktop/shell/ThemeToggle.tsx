import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { MoonIcon, SunIcon, SystemIcon } from './icons/ThemeIcons';
import { useTheme, type ThemePreference } from '../state/ThemeContext';

const OPTIONS: { value: ThemePreference; label: string; icon: typeof SystemIcon }[] = [
  { value: 'system', label: 'Sistema', icon: SystemIcon },
  { value: 'light', label: 'Claro', icon: SunIcon },
  { value: 'dark', label: 'Oscuro', icon: MoonIcon },
];

const MENU =
  'theme-dropdown-menu absolute right-0 bottom-full z-50 mb-1 min-w-[7.5rem] list-none rounded-md border border-gray-400/50 bg-white/95 py-1 text-xs shadow-sm backdrop-blur-lg dark:border-gray-400/30 dark:bg-black/90';
const OPTION =
  'flex w-full items-center gap-2 px-3 py-1.5 text-left text-secondary transition-colors hover:bg-black/[0.06] hover:text-primary dark:hover:bg-white/[0.08]';
const OPTION_SELECTED = 'font-semibold text-primary';

export default function ThemeToggle({ className }: { className?: string }) {
  const { isDark, preference, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const followingSystem = preference === 'system';

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current?.contains(event.target as Node)) return;
      close();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        close();
      }
    }

    window.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [close, open]);

  function selectTheme(next: ThemePreference) {
    setTheme(next);
    close();
  }

  return (
    <div
      ref={containerRef}
      className={['theme-dropdown relative', className].filter(Boolean).join(' ')}
    >
      <button
        type="button"
        className="theme-dropdown-trigger tooltip inline-flex h-6 cursor-pointer items-center gap-1 rounded-sm px-1 text-secondary transition-colors duration-200 hover:text-primary"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Cambiar tema"
        data-tooltip="Cambiar tema"
        onClick={() => setOpen((value) => !value)}
      >
        {followingSystem ? <SystemIcon /> : isDark ? <MoonIcon /> : <SunIcon />}
        <ChevronDown className="h-3 w-3 opacity-60" strokeWidth={2} aria-hidden />
      </button>
      <ul
        className={[MENU, open ? '' : 'hidden'].filter(Boolean).join(' ')}
        role="listbox"
        aria-label="Opciones de tema"
      >
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const selected = preference === option.value;
          return (
            <li key={option.value}>
              <button
                type="button"
                className={[OPTION, selected && OPTION_SELECTED].filter(Boolean).join(' ')}
                role="option"
                aria-selected={selected}
                data-theme-value={option.value}
                onClick={() => selectTheme(option.value)}
              >
                <Icon className="h-3.5 w-3.5" />
                {option.label}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
