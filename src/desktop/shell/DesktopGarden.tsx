import { gardenSprites } from './gardenSprites';

const SPRITES = gardenSprites();

/** Pixel-art garden along the default desktop fill. Hidden when a wallpaper is set. */
export default function DesktopGarden() {
  return (
    <div
      className="desktop-garden pointer-events-none absolute inset-x-0 bottom-0 h-[7.5rem]"
      data-desktop-garden
    >
      <div
        className="absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(to_top,rgb(74_124_63/0.16),transparent)] dark:bg-[linear-gradient(to_top,rgb(74_124_63/0.22),transparent)]"
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-[calc(2.5rem+max(var(--taskbar-bottom-pad),var(--safe-area-bottom))-0.35rem)] flex items-end justify-center gap-0.5 overflow-hidden px-2 opacity-[0.82] dark:opacity-90">
        {SPRITES.map((sprite, index) => (
          <img
            key={`${sprite.src}-${index}`}
            src={sprite.src}
            alt=""
            width={sprite.size}
            height={sprite.size}
            decoding="async"
            data-garden-sprite
            className="shrink-0 [image-rendering:pixelated]"
            style={{
              width: sprite.size,
              height: sprite.size,
              marginBottom: sprite.lift,
              opacity: sprite.opacity,
              transform: sprite.flip ? 'scaleX(-1)' : undefined,
            }}
          />
        ))}
      </div>
    </div>
  );
}
