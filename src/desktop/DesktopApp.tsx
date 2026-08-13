import type { DesktopIconUrls } from '@desktop/lib/desktopIcons';
import type { GithubContributions } from '@/lib/githubContributions';
import { useViewportSize } from './lib/useViewportSize';
import { useDesktopApps } from './state/useDesktopApps';
import { WindowManagerProvider } from './state/WindowManagerContext';
import { WallpaperProvider } from './state/WallpaperContext';
import { ThemeProvider } from './state/ThemeContext';
import { WindowTransparencyProvider } from './state/WindowTransparencyContext';
import { GithubContributionsProvider } from './apps/about/contributionsContext';
import DesktopShell from './DesktopShell';
import type { BlogPostSummary, WallpaperOption } from './types';

interface DesktopAppProps {
  posts: BlogPostSummary[];
  wallpapers: WallpaperOption[];
  desktopIconUrls: DesktopIconUrls;
  githubContributions?: GithubContributions | null;
}

export default function DesktopApp({
  posts,
  wallpapers,
  desktopIconUrls,
  githubContributions = null,
}: DesktopAppProps) {
  const viewport = useViewportSize();
  const { apps, defs } = useDesktopApps(posts);
  return (
    <WindowManagerProvider
      defs={defs}
      viewportWidth={viewport.width}
      viewportHeight={viewport.height}
    >
      <ThemeProvider>
        <WindowTransparencyProvider>
          <WallpaperProvider wallpapers={wallpapers}>
            <GithubContributionsProvider value={githubContributions}>
              <DesktopShell
                apps={apps}
                defs={defs}
                posts={posts}
                desktopIconUrls={desktopIconUrls}
                viewport={viewport}
              />
            </GithubContributionsProvider>
          </WallpaperProvider>
        </WindowTransparencyProvider>
      </ThemeProvider>
    </WindowManagerProvider>
  );
}
