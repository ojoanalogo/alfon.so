import { useWallpaper } from '../state/WallpaperContext';
import DesktopGarden from './DesktopGarden';

export default function DesktopWallpaper() {
  const { activeWallpaper, status, desktopBackgroundColor, backgroundColorId } = useWallpaper();
  const showGarden = !activeWallpaper && backgroundColorId === 'default';

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
          data-desktop-wallpaper
        />
      )}
      {showGarden && <DesktopGarden />}
    </div>
  );
}
