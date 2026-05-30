import { useWallpaper } from './context/WallpaperContext';

export default function DesktopWallpaper() {
  const { activeWallpaper, status, desktopBackgroundColor } = useWallpaper();

  return (
    <div
      className="desktop-wallpaper"
      aria-hidden="true"
      style={{ backgroundColor: desktopBackgroundColor }}
    >
      {activeWallpaper && status === 'ready' && (
        <img
          className="desktop-wallpaper__image"
          src={activeWallpaper.src}
          alt=""
          decoding="async"
        />
      )}
    </div>
  );
}
