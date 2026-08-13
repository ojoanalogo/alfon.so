import { createContext, useContext, type ReactNode } from 'react';
import type { GithubContributions } from '@/lib/githubContributions';

const GithubContributionsContext = createContext<GithubContributions | null>(null);

export function GithubContributionsProvider({
  value,
  children,
}: {
  value: GithubContributions | null;
  children: ReactNode;
}) {
  return (
    <GithubContributionsContext.Provider value={value}>
      {children}
    </GithubContributionsContext.Provider>
  );
}

export function useGithubContributions(): GithubContributions | null {
  return useContext(GithubContributionsContext);
}
