import type { ReactNode } from 'react';
import {
  useGridSettings,
  type GridIconSize,
  type GridSpacing,
  type GridSortBy,
} from '../context/GridSettingsContext';
import { MoonIcon, SunIcon } from '../icons/ThemeIcons';

interface OptionsProps<T extends string> {
  options: Array<{ value: T; label: string; icon?: ReactNode }>;
  selected: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}

function OptionRow<T extends string>({ options, selected, onChange, ariaLabel }: OptionsProps<T>) {
  return (
    <div className="theme-segmented" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={['theme-segmented__option', selected === option.value && 'is-active']
            .filter(Boolean)
            .join(' ')}
          aria-pressed={selected === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.icon ? (
            <span className="theme-segmented__icon" aria-hidden="true">
              {option.icon}
            </span>
          ) : null}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}

/** Icon size / spacing / sort / label tone controls for the icon grid. */
export default function GridSettingsSection() {
  const { settings, setIconSize, setSpacing, setSortBy, setLabelTone, reset } = useGridSettings();

  return (
    <div className="settings-group">
      <div className="settings-row">
        <div className="settings-row__copy">
          <span className="settings-row__label">Tamaño de iconos</span>
          <span className="settings-row__hint">En carpetas y vista de cuadrícula</span>
        </div>
        <OptionRow<GridIconSize>
          options={[
            { value: 'small', label: 'Pequeño' },
            { value: 'medium', label: 'Mediano' },
            { value: 'large', label: 'Grande' },
          ]}
          selected={settings.iconSize}
          onChange={setIconSize}
          ariaLabel="Tamaño de iconos"
        />
      </div>

      <div className="settings-row">
        <div className="settings-row__copy">
          <span className="settings-row__label">Separación</span>
          <span className="settings-row__hint">Espacio entre iconos en la cuadrícula</span>
        </div>
        <OptionRow<GridSpacing>
          options={[
            { value: 'compact', label: 'Compacta' },
            { value: 'normal', label: 'Normal' },
            { value: 'roomy', label: 'Amplia' },
          ]}
          selected={settings.spacing}
          onChange={setSpacing}
          ariaLabel="Separación de iconos"
        />
      </div>

      <div className="settings-row">
        <div className="settings-row__copy">
          <span className="settings-row__label">Orden</span>
          <span className="settings-row__hint">Cómo se ordenan los archivos en lista</span>
        </div>
        <OptionRow<GridSortBy>
          options={[
            { value: 'name', label: 'Nombre' },
            { value: 'kind', label: 'Tipo' },
          ]}
          selected={settings.sortBy}
          onChange={setSortBy}
          ariaLabel="Orden de la lista"
        />
      </div>

      <div className="settings-row">
        <div className="settings-row__copy">
          <span className="settings-row__label">Etiquetas del escritorio</span>
          <span className="settings-row__hint">Color del texto bajo cada icono</span>
        </div>
        <OptionRow<'auto' | 'light' | 'dark'>
          options={[
            { value: 'auto', label: 'Auto', icon: <span className="theme-segmented__emoji">🖥</span> },
            {
              value: 'light',
              label: 'Claro',
              icon: <SunIcon className="theme-segmented__svg" />,
            },
            {
              value: 'dark',
              label: 'Oscuro',
              icon: <MoonIcon className="theme-segmented__svg" />,
            },
          ]}
          selected={settings.labelTone}
          onChange={setLabelTone}
          ariaLabel="Color de etiquetas"
        />
      </div>

      <div className="settings-row">
        <div className="settings-row__copy">
          <span className="settings-row__label">Restablecer</span>
          <span className="settings-row__hint">Vuelve a los valores por defecto</span>
        </div>
        <button type="button" className="window-action-btn" onClick={reset}>
          Restablecer
        </button>
      </div>
    </div>
  );
}
