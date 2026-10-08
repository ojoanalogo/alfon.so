import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { GithubContributions } from '@/lib/githubContributions';
import { useLiveGithubContributions } from './useLiveGithubContributions';

const INITIAL: GithubContributions = {
  username: 'ojoanalogo',
  profileUrl: 'https://github.com/ojoanalogo',
  total: 1,
  days: [{ date: '2026-01-01', count: 1, level: 1 }],
};

const FRESH: GithubContributions = {
  username: 'ojoanalogo',
  profileUrl: 'https://github.com/ojoanalogo',
  total: 9,
  days: [{ date: '2026-01-02', count: 9, level: 4 }],
};

function Probe({ initial }: { initial: GithubContributions | null }) {
  const contributions = useLiveGithubContributions(initial);
  return <div data-testid="total">{contributions?.total ?? 'none'}</div>;
}

describe('useLiveGithubContributions', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          total: { lastYear: FRESH.total },
          contributions: FRESH.days,
        }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the build-time snapshot first, then swaps in a live refresh', async () => {
    render(<Probe initial={INITIAL} />);
    expect(screen.getByTestId('total').textContent).toBe('1');

    await waitFor(() => {
      expect(screen.getByTestId('total').textContent).toBe('9');
    });

    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain('github-contributions-api.jogruber.de');
  });

  it('keeps the snapshot when the live fetch returns no days', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ contributions: [] }),
      }),
    );

    render(<Probe initial={INITIAL} />);
    expect(screen.getByTestId('total').textContent).toBe('1');
    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalled();
    });
    expect(screen.getByTestId('total').textContent).toBe('1');
  });
});
