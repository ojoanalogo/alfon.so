import ThemeSegmentedControl from './ThemeSegmentedControl';
import { useWallpaper } from '../context/WallpaperContext';

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
      className={['settings-color-swatch', selected && 'is-selected'].filter(Boolean).join(' ')}
      aria-pressed={selected}
      aria-label={label}
      title={label}
      onClick={onSelect}
    >
      {colorId === 'default' ? (
        <span className="settings-color-swatch__auto" aria-hidden="true">
          <span className="settings-color-swatch__auto-light" />
          <span className="settings-color-swatch__auto-dark" />
        </span>
      ) : (
        <span
          className="settings-color-swatch__fill"
          style={{ backgroundColor: value }}
          aria-hidden="true"
        />
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
      <div className="settings-group">
        <div className="settings-row settings-row--theme">
          <div className="settings-row__copy">
            <span className="settings-row__label">Tema</span>
            <span className="settings-row__hint">Claro u oscuro en este navegador</span>
          </div>
          <ThemeSegmentedControl />
        </div>
      </div>

      <h4 className="settings-block__subtitle">Color de relleno</h4>
      <div className="settings-group">
        <div className="settings-color-grid" role="list">
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

      <h4 className="settings-block__subtitle">Imágenes</h4>
      {wallpapers.length === 0 ? (
        <p className="settings-block__empty text-muted">
          No hay fondos en <code>assets/wallpapers</code>.
        </p>
      ) : (
        <div className="settings-group settings-group--flush">
          <ul className="settings-wallpaper-grid" role="list">
            {wallpapers.map((wallpaper) => {
              const selected = wallpaper.id === wallpaperId;
              return (
                <li key={wallpaper.id}>
                  <button
                    type="button"
                    className={['settings-wallpaper', selected && 'is-selected']
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
