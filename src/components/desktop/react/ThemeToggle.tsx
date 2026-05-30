import { MoonIcon, SunIcon } from './icons/ThemeIcons';
import { useTheme } from './useTheme';

export default function ThemeToggle({ className }: { className?: string }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      data-tooltip="Cambiar tema"
      onClick={toggleTheme}
      className={['theme-toggle tooltip p-1 text-secondary transition-all duration-200 hover:text-primary', className]
        .filter(Boolean)
        .join(' ')}
    >
      {isDark ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}
