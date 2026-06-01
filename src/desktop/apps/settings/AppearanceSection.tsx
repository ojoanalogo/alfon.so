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
        <span className={`block ${SWATCH_INNER}`} style={{ backgroundColor: value }} aria-hidden="true" />
      )}
    </button>
  );
}

/** Theme + desktop fill color + wallpaper picker — composed by the Settings app. */
export default function AppearanceSection() {
  const {
    wallpapers,
    wallpaperId,
    backgroundColorId,
    setWallpaper,
    setBackgroundColor,
    desktopColors,
  } = useWallpaper();

  return (
    <>
      <div className={SETTINGS_GROUP}>
        <SettingsRow label="Tema" hint="Claro u oscuro en este navegador">
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

      <h4>Imágenes</h4>
      {wallpapers.length === 0 ? (
        <p className="m-0 text-[0.6875rem] text-muted">
          No hay fondos en <code>assets/wallpapers</code>.
        </p>
      ) : (
        <div className={`${SETTINGS_GROUP} p-[0.375rem]`}>
          <ul
            className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(6.75rem,1fr))] gap-2 p-0"
            role="list"
          >
            {wallpapers.map((wallpaper) => {
              const selected = wallpaper.id === wallpaperId;
              return (
                <li key={wallpaper.id}>
                  <button
                    type="button"
                    className={[
                      'block aspect-[16/10] w-full cursor-pointer overflow-hidden rounded-[0.375rem] border-2 bg-[rgb(113_113_122/0.12)] p-0',
                      selected
                        ? 'border-[color:var(--color-highlight-border)] shadow-[0_0_0_1px_var(--color-highlight-border)]'
                        : 'border-transparent hover:border-[color:var(--color-hairline-strong)]',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    aria-pressed={selected}
                    aria-label={wallpaper.label}
                    title={wallpaper.label}
                    onClick={() => setWallpaper(wallpaper.id)}
                  >
                    <img
                      src={wallpaper.thumbSrc}
                      alt=""
                      width={280}
                      height={158}
                      loading="lazy"
                      decoding="async"
                      className="block h-full w-full object-cover"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}
