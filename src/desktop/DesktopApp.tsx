import type { DesktopIconUrls } from '@desktop/lib/desktopIcons';
import { useViewportSize } from './lib/useViewportSize';
import { useDesktopApps } from './state/useDesktopApps';
import { WindowManagerProvider } from './state/WindowManagerContext';
import { WallpaperProvider } from './state/WallpaperContext';
import { ThemeProvider } from './state/ThemeContext';
import DesktopShell from './DesktopShell';
import type { BlogPostSummary, WallpaperOption } from './types';

interface DesktopAppProps {
  posts: BlogPostSummary[];
  wallpapers: WallpaperOption[];
  desktopIconUrls: DesktopIconUrls;
}

export default function DesktopApp({ posts, wallpapers, desktopIconUrls }: DesktopAppProps) {
  const viewport = useViewportSize();
  const { apps, defs } = useDesktopApps(posts);
  return (
    <WindowManagerProvider
      defs={defs}
      viewportWidth={viewport.width}
      viewportHeight={viewport.height}
    >
      <ThemeProvider>
        <WallpaperProvider wallpapers={wallpapers}>
          <DesktopShell
            apps={apps}
            defs={defs}
            posts={posts}
            desktopIconUrls={desktopIconUrls}
            viewport={viewport}
          />
        </WallpaperProvider>
      </ThemeProvider>
    </WindowManagerProvider>
  );
}
