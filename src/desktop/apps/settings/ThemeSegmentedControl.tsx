import { MoonIcon, SunIcon, SystemIcon } from '@desktop/shell/icons/ThemeIcons';
import { useTheme, type ThemePreference } from '@desktop/state/ThemeContext';
import { SegmentedControl } from './ui';

export default function ThemeSegmentedControl() {
  const { preference, setTheme } = useTheme();

  return (
    <SegmentedControl<ThemePreference>
      ariaLabel="Tema"
      selected={preference}
      onChange={setTheme}
      options={[
        {
          value: 'system',
          label: 'Sistema',
          icon: <SystemIcon className="h-3.5 w-3.5" />,
        },
        { value: 'light', label: 'Claro', icon: <SunIcon className="h-3.5 w-3.5" /> },
        { value: 'dark', label: 'Oscuro', icon: <MoonIcon className="h-3.5 w-3.5" /> },
      ]}
    />
  );
}
