import ThemeSegmentedControl from './ThemeSegmentedControl';
import { iconPackPreviewUrls } from '@desktop/lib/iconPacks';
import { useIconPack } from '@desktop/state/IconPackContext';
import { useWallpaper } from '@desktop/state/WallpaperContext';
import { useWindowTransparency } from '@desktop/state/WindowTransparencyContext';
import { STATE_CLASS } from '@desktop/lib/stateClasses';
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
          <span className="bg-[var(--color-background-light)]" />
          <span className="bg-[var(--color-background-dark)]" />
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

function PatternSwatch({
  pattern,
  fillColor,
  selected,
  onSelect,
}: {
  pattern: {
    id: string;
    label: string;
    backgroundImage: string;
    backgroundSize: string;
    opacity: number;
  };
  fillColor: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={[
        'block aspect-[16/10] w-full cursor-pointer overflow-hidden rounded-[0.375rem] border-2 p-0',
        selected
          ? 'border-[color:var(--color-highlight-border)] shadow-[0_0_0_1px_var(--color-highlight-border)]'
          : 'border-transparent hover:border-[color:var(--color-hairline-strong)]',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-pressed={selected}
      aria-label={pattern.label}
      title={pattern.label}
      onClick={onSelect}
      style={{ backgroundColor: fillColor }}
    >
      <span
        className="block h-full w-full"
        aria-hidden="true"
        style={{
          backgroundImage: pattern.backgroundImage,
          backgroundSize: pattern.backgroundSize,
          opacity: pattern.opacity,
        }}
      />
    </button>
  );
}

/** Theme + desktop fill color + pattern + wallpaper picker — composed by the Settings app. */
export default function AppearanceSection() {
  const {
    wallpapers,
    desktopPatterns,
    wallpaperId,
    patternId,
    backgroundColorId,
    setWallpaper,
    setPattern,
    setBackgroundColor,
    desktopColors,
    desktopBackgroundColor,
  } = useWallpaper();
  const { level: windowTransparency, setLevel: setWindowTransparency } = useWindowTransparency();
  const { packId, packs, setPackId } = useIconPack();

  const patternPreviewFill = desktopBackgroundColor;

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
          label="Transparencia"
          hint="Cuánto se transparentan las ventanas. La enfocada se queda un poco más sólida"
        >
          <div className="flex shrink-0 items-center gap-2">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={windowTransparency}
              aria-label="Transparencia de ventanas"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={windowTransparency}
              className="h-1 w-24 cursor-pointer accent-zinc-800 dark:accent-zinc-200"
              onChange={(event) => setWindowTransparency(Number(event.target.value))}
            />
            <span className="w-8 text-right text-[0.625rem] text-muted tabular-nums">
              {windowTransparency}%
            </span>
          </div>
        </SettingsRow>
      </div>

      <section className="flex flex-col gap-[0.375rem]" aria-labelledby="settings-icons-heading">
        <h4
          id="settings-icons-heading"
          className="m-0 px-[0.125rem] text-[0.625rem] font-semibold tracking-[0.04em] text-muted uppercase"
        >
          Iconos
        </h4>
        <div className={`${SETTINGS_GROUP} p-[0.375rem]`}>
          {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
          <ul
            className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(6.75rem,1fr))] gap-2 p-0"
            role="list"
          >
            {packs.map((pack) => {
              const selected = pack.id === packId;
              return (
                <li key={pack.id}>
                  <button
                    type="button"
                    className={[
                      'flex w-full cursor-pointer flex-col items-center gap-1 rounded-[0.375rem] border-2 px-1 py-2',
                      selected
                        ? 'border-[color:var(--color-highlight-border)] shadow-[0_0_0_1px_var(--color-highlight-border)]'
                        : 'border-transparent hover:border-[color:var(--color-hairline-strong)]',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    aria-pressed={selected}
                    aria-label={pack.label}
                    title={pack.label}
                    onClick={() => setPackId(pack.id)}
                  >
                    <span className="flex h-7 items-center justify-center gap-1" aria-hidden="true">
                      {iconPackPreviewUrls(pack).map((src) => (
                        <img
                          key={src}
                          src={src}
                          alt=""
                          width={24}
                          height={24}
                          className="h-6 w-6 object-contain [image-rendering:pixelated]"
                        />
                      ))}
                    </span>
                    <span className="text-[0.5625rem] text-secondary">{pack.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

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

      <section className="flex flex-col gap-[0.375rem]" aria-labelledby="settings-patterns-heading">
        <h4
          id="settings-patterns-heading"
          className="m-0 px-[0.125rem] text-[0.625rem] font-semibold tracking-[0.04em] text-muted uppercase"
        >
          Patrones
        </h4>
        <div className={`${SETTINGS_GROUP} p-[0.375rem]`}>
          {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
          <ul
            className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(6.75rem,1fr))] gap-2 p-0"
            role="list"
          >
            {desktopPatterns.map((pattern) => {
              const selected = pattern.id === patternId;
              return (
                <li key={pattern.id}>
                  <PatternSwatch
                    pattern={pattern}
                    fillColor={patternPreviewFill}
                    selected={selected}
                    onSelect={() => setPattern(selected ? null : pattern.id)}
                  />
                </li>
              );
            })}
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
