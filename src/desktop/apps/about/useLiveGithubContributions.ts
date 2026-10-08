import { useEffect, useState } from 'react';
import {
  fetchGithubContributions,
  githubUsernameFromSocialLinks,
  type GithubContributions,
} from '@/lib/githubContributions';

/**
 * Show build-time contributions immediately, then refresh from the public
 * JSON API in the browser so the About graph stays current between deploys.
 */
export function useLiveGithubContributions(
  initial: GithubContributions | null | undefined,
): GithubContributions | null {
  const [contributions, setContributions] = useState<GithubContributions | null>(initial ?? null);

  useEffect(() => {
    setContributions(initial ?? null);
  }, [initial]);

  useEffect(() => {
    const username = initial?.username || githubUsernameFromSocialLinks();
    if (!username) return;

    let cancelled = false;
    void fetchGithubContributions(username, { htmlFallback: false }).then((fresh) => {
      if (cancelled || fresh.days.length === 0) return;
      setContributions(fresh);
    });

    return () => {
      cancelled = true;
    };
  }, [initial?.username]);

  return contributions;
}
