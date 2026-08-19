import { useWallpaper } from '../state/WallpaperContext';

export default function DesktopWallpaper() {
  const { activeWallpaper, activePattern, status, desktopBackgroundColor } = useWallpaper();

  return (
    <div
      className="absolute inset-0 z-0 overflow-hidden bg-background"
      aria-hidden="true"
      style={{ backgroundColor: desktopBackgroundColor }}
    >
      {activePattern && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: activePattern.backgroundImage,
            backgroundSize: activePattern.backgroundSize,
            opacity: activePattern.opacity,
          }}
          data-desktop-pattern
        />
      )}
      {activeWallpaper && status === 'ready' && (
        <img
          className="h-full w-full object-cover object-center"
          src={activeWallpaper.src}
          alt=""
          decoding="async"
          data-desktop-wallpaper
        />
      )}
    </div>
  );
}
