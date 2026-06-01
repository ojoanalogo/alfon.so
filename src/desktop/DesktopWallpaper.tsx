import { useWallpaper } from './context/WallpaperContext';

export default function DesktopWallpaper() {
  const { activeWallpaper, status, desktopBackgroundColor } = useWallpaper();

  return (
    <div
      className="absolute inset-0 z-0 overflow-hidden bg-background"
      aria-hidden="true"
      style={{ backgroundColor: desktopBackgroundColor }}
    >
      {activeWallpaper && status === 'ready' && (
        <img
          className="h-full w-full object-cover object-center"
          src={activeWallpaper.src}
          alt=""
          decoding="async"
        />
      )}
    </div>
  );
}
