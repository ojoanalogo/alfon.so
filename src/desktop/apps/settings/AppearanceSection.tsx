import ThemeSegmentedControl from './ThemeSegmentedControl';
import { useWallpaper } from '@desktop/state/WallpaperContext';
import { useWindowTransparency } from '@desktop/state/WindowTransparencyContext';
import { STATE_CLASS } from '@desktop/lib/stateClasses';
import { SETTINGS_GROUP, SettingsRow, SettingsToggle } from './ui';

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
        selected && STATE_CLASS.selected,
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
  const { enabled: windowTransparencyEnabled, setEnabled: setWindowTransparencyEnabled } =
    useWindowTransparency();

  return (
    <div className="flex flex-col gap-4">
      <div className={SETTINGS_GROUP}>
        <SettingsRow
          label="Tema"
          hint="Sistema sigue el modo del SO; la bandeja del sistema también ofrece un selector"
        >
          <ThemeSegmentedControl />
        </SettingsRow>
        <SettingsRow
          label="Transparencia sin foco"
          hint="Las ventanas en segundo plano se vuelven semitransparentes"
        >
          <SettingsToggle
            checked={windowTransparencyEnabled}
            onChange={setWindowTransparencyEnabled}
            ariaLabel="Transparencia sin foco"
          />
        </SettingsRow>
      </div>

      <section
        className="flex flex-col gap-[0.375rem]"
        aria-labelledby="settings-fill-color-heading"
      >
        <h4
          id="settings-fill-color-heading"
          className="m-0 px-[0.125rem] text-[0.625rem] font-semibold tracking-[0.04em] text-muted uppercase"
        >
          Color de relleno
        </h4>
        <div className={SETTINGS_GROUP}>
          {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
          <ul className="m-0 flex list-none flex-wrap gap-[0.625rem] p-3" role="list">
            {desktopColors.map((color) => (
              <li key={color.id}>
                <ColorSwatch
                  colorId={color.id}
                  value={color.value}
                  label={color.label}
                  selected={wallpaperId === null && backgroundColorId === color.id}
                  onSelect={() => setBackgroundColor(color.id)}
                />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        className="flex flex-col gap-[0.375rem]"
        aria-labelledby="settings-wallpapers-heading"
      >
        <h4
          id="settings-wallpapers-heading"
          className="m-0 px-[0.125rem] text-[0.625rem] font-semibold tracking-[0.04em] text-muted uppercase"
        >
          Imágenes
        </h4>
        {wallpapers.length === 0 ? (
          <p className="m-0 text-[0.6875rem] text-muted">
            No hay fondos en <code>assets/wallpapers</code>.
          </p>
        ) : (
          <div className={`${SETTINGS_GROUP} p-[0.375rem]`}>
            {/* role="list" is intentional: WebKit drops list semantics when
              list-style is removed, so VoiceOver needs it to announce a list. */}
            {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
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
      </section>
    </div>
  );
}
