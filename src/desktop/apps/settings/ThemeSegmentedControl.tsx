import { MoonIcon, SunIcon } from '../../icons/ThemeIcons';
import { useTheme, type ThemeMode } from '../../useTheme';
import { SegmentedControl } from './ui';

export default function ThemeSegmentedControl() {
  const { theme, setTheme } = useTheme();

  return (
    <SegmentedControl<ThemeMode>
      ariaLabel="Tema"
      selected={theme}
      onChange={setTheme}
      options={[
        { value: 'light', label: 'Claro', icon: <SunIcon className="h-3.5 w-3.5" /> },
        { value: 'dark', label: 'Oscuro', icon: <MoonIcon className="h-3.5 w-3.5" /> },
      ]}
    />
  );
}
