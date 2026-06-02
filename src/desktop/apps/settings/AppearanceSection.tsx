import ThemeSegmentedControl from './ThemeSegmentedControl';
import { useWallpaper } from '@desktop/state/WallpaperContext';
import { SETTINGS_GROUP, SettingsRow } from './ui';

const SWATCH_INNER =
  'h-full w-full overflow-hidden rounded-[inherit] border border-[rgb(0_0_0/0.12)] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.18)]';

function ColorSwatch({
  colorId,
  value,
  label,
  selected,
  onSelect,
}: {
  colorId: string;
  value: string | 'default';
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={[
        'settings-color-swatch relative h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent p-0',
        selected && 'is-selected',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-pressed={selected}
      aria-label={label}
      title={label}
      onClick={onSelect}
    >
      {colorId === 'default' ? (
        <span className={`grid grid-cols-2 ${SWATCH_INNER}`} aria-hidden="true">
          <span className="bg-[var(--color-surface-light)]" />
          <span className="bg-[var(--color-surface-dark)]" />
        </span>
      ) : (
        <span
          className={`block ${SWATCH_INNER}`}
          style={{ backgroundColor: value }}
          aria-hidden="true"
        />
      )}
    </button>
  );
}

/** Theme + desktop fill color — composed by the Settings app. */
export default function AppearanceSection() {
  const { wallpaperId, backgroundColorId, setBackgroundColor, desktopColors } = useWallpaper();

  return (
    <>
      <div className={SETTINGS_GROUP}>
        <SettingsRow label="Tema" hint="Sistema sigue el modo del SO; el botón fuerza claro u oscuro">
          <ThemeSegmentedControl />
        </SettingsRow>
      </div>

      <h4>Color de relleno</h4>
      <div className={SETTINGS_GROUP}>
        <div className="flex flex-wrap gap-[0.625rem] p-3" role="list">
          {desktopColors.map((color) => (
            <ColorSwatch
              key={color.id}
              colorId={color.id}
              value={color.value}
              label={color.label}
              selected={wallpaperId === null && backgroundColorId === color.id}
              onSelect={() => setBackgroundColor(color.id)}
            />
          ))}
        </div>
      </div>
    </>
  );
}
