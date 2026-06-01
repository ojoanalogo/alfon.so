import {
  useGridSettings,
  type GridIconSize,
  type GridSpacing,
  type GridSortBy,
} from '@desktop/state/GridSettingsContext';
import { MoonIcon, SunIcon } from '@desktop/shell/icons/ThemeIcons';
import { WINDOW_ACTION_BTN } from '@/styles/tokens';
import { SegmentedControl, SettingsRow, SETTINGS_GROUP } from './ui';

/** Icon size / spacing / sort / label tone controls for the icon grid. */
export default function GridSettingsSection() {
  const { settings, setIconSize, setSpacing, setSortBy, setLabelTone, reset } = useGridSettings();

  return (
    <div className={SETTINGS_GROUP}>
      <SettingsRow label="Tamaño de iconos" hint="En carpetas y vista de cuadrícula">
        <SegmentedControl<GridIconSize>
          ariaLabel="Tamaño de iconos"
          selected={settings.iconSize}
          onChange={setIconSize}
          options={[
            { value: 'small', label: 'Pequeño' },
            { value: 'medium', label: 'Mediano' },
            { value: 'large', label: 'Grande' },
          ]}
        />
      </SettingsRow>

      <SettingsRow label="Separación" hint="Espacio entre iconos en la cuadrícula">
        <SegmentedControl<GridSpacing>
          ariaLabel="Separación de iconos"
          selected={settings.spacing}
          onChange={setSpacing}
          options={[
            { value: 'compact', label: 'Compacta' },
            { value: 'normal', label: 'Normal' },
            { value: 'roomy', label: 'Amplia' },
          ]}
        />
      </SettingsRow>

      <SettingsRow label="Orden" hint="Cómo se ordenan los archivos en lista">
        <SegmentedControl<GridSortBy>
          ariaLabel="Orden de la lista"
          selected={settings.sortBy}
          onChange={setSortBy}
          options={[
            { value: 'name', label: 'Nombre' },
            { value: 'kind', label: 'Tipo' },
          ]}
        />
      </SettingsRow>

      <SettingsRow label="Etiquetas del escritorio" hint="Color del texto bajo cada icono">
        <SegmentedControl<'auto' | 'light' | 'dark'>
          ariaLabel="Color de etiquetas"
          selected={settings.labelTone}
          onChange={setLabelTone}
          options={[
            { value: 'auto', label: 'Auto', icon: <span className="text-[0.75rem] leading-none">🖥</span> },
            { value: 'light', label: 'Claro', icon: <SunIcon className="h-3.5 w-3.5" /> },
            { value: 'dark', label: 'Oscuro', icon: <MoonIcon className="h-3.5 w-3.5" /> },
          ]}
        />
      </SettingsRow>

      <SettingsRow label="Restablecer" hint="Vuelve a los valores por defecto">
        <button type="button" className={WINDOW_ACTION_BTN} onClick={reset}>
          Restablecer
        </button>
      </SettingsRow>
    </div>
  );
}
