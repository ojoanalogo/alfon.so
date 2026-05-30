import { useTheme } from '../useTheme';

export default function ThemeSegmentedControl() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-segmented" role="group" aria-label="Tema">
      <button
        type="button"
        className={['theme-segmented__option', theme === 'light' && 'is-active'].filter(Boolean).join(' ')}
        aria-pressed={theme === 'light'}
        onClick={() => setTheme('light')}
      >
        <span className="theme-segmented__icon" aria-hidden="true">
          ☀
        </span>
        <span>Claro</span>
      </button>
      <button
        type="button"
        className={['theme-segmented__option', theme === 'dark' && 'is-active'].filter(Boolean).join(' ')}
        aria-pressed={theme === 'dark'}
        onClick={() => setTheme('dark')}
      >
        <span className="theme-segmented__icon" aria-hidden="true">
          ☾
        </span>
        <span>Oscuro</span>
      </button>
    </div>
  );
}
