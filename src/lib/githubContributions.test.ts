import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchGithubContributions,
  githubProfileUrl,
  githubUsernameFromSocialLinks,
  githubUsernameFromUrl,
  monthLabelsForWeeks,
  parseContributionApiPayload,
  parseGithubContributionsHtml,
  totalFromPayload,
  weeksFromDays,
  type ContributionDay,
} from './githubContributions';

function day(date: string, count = 0, level: ContributionDay['level'] = 0): ContributionDay {
  return { date, count, level };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('githubUsernameFromUrl', () => {
  it('reads the first path segment from a github profile url', () => {
    expect(githubUsernameFromUrl('https://github.com/ojoanalogo/')).toBe('ojoanalogo');
    expect(githubUsernameFromUrl('https://github.com/ojoanalogo')).toBe('ojoanalogo');
  });

  it('rejects non-github hosts and invalid urls', () => {
    expect(githubUsernameFromUrl('https://gitlab.com/ojoanalogo')).toBeNull();
    expect(githubUsernameFromUrl('not-a-url')).toBeNull();
  });
});

describe('githubUsernameFromSocialLinks', () => {
  it('finds the github social link', () => {
    expect(
      githubUsernameFromSocialLinks([
        { platform: 'twitter', url: 'https://twitter.com/x', label: 'X' },
        { platform: 'github', url: 'https://github.com/ojoanalogo/', label: 'Github' },
      ]),
    ).toBe('ojoanalogo');
  });

  it('returns null when github is missing', () => {
    expect(githubUsernameFromSocialLinks([])).toBeNull();
  });
});

describe('githubProfileUrl', () => {
  it('builds the profile url', () => {
    expect(githubProfileUrl('ojoanalogo')).toBe('https://github.com/ojoanalogo');
  });
});

describe('parseContributionApiPayload', () => {
  it('keeps valid days and sorts them', () => {
    const days = parseContributionApiPayload({
      contributions: [
        { date: '2026-01-02', count: 3, level: 2 },
        { date: '2026-01-01', count: 0, level: 0 },
        { date: 'nope', count: 1, level: 1 },
      ],
    });
    expect(days).toEqual([day('2026-01-01'), day('2026-01-02', 3, 2)]);
  });

  it('returns an empty list for junk payloads', () => {
    expect(parseContributionApiPayload(null)).toEqual([]);
    expect(parseContributionApiPayload({ contributions: 'nope' })).toEqual([]);
  });

  it('clamps levels to 0–4', () => {
    expect(
      parseContributionApiPayload({ contributions: [{ date: '2026-01-01', level: 9 }] }),
    ).toEqual([day('2026-01-01', 0, 4)]);
  });
});

describe('parseGithubContributionsHtml', () => {
  it('reads date and level from calendar cells', () => {
    const html = `
      <td data-date="2026-01-02" data-level="2" data-count="4"></td>
      <rect data-level="1" data-date="2026-01-01"></rect>
    `;
    expect(parseGithubContributionsHtml(html)).toEqual([
      day('2026-01-01', 0, 1),
      day('2026-01-02', 4, 2),
    ]);
  });
});

describe('totalFromPayload', () => {
  it('prefers lastYear when present', () => {
    expect(totalFromPayload({ total: { lastYear: 12 } }, [day('2026-01-01', 99)])).toBe(12);
  });

  it('falls back to summing day counts', () => {
    expect(totalFromPayload({}, [day('2026-01-01', 2), day('2026-01-02', 3)])).toBe(5);
  });
});

describe('weeksFromDays', () => {
  it('pads the first week so Sunday is column-aligned', () => {
    // 2026-01-01 is a Thursday (UTC weekday 4).
    const weeks = weeksFromDays([day('2026-01-01', 1, 1), day('2026-01-02', 2, 1)]);
    expect(weeks[0]).toHaveLength(7);
    expect(weeks[0][4]).toEqual(day('2026-01-01', 1, 1));
    expect(weeks[0][5]).toEqual(day('2026-01-02', 2, 1));
    expect(weeks[0][0]).toBeNull();
  });

  it('returns no weeks for an empty series', () => {
    expect(weeksFromDays([])).toEqual([]);
  });
});

describe('monthLabelsForWeeks', () => {
  it('emits a label when the month changes', () => {
    const days: ContributionDay[] = [];
    for (let index = 4; index <= 32; index += 1) {
      const date = new Date(Date.UTC(2026, 0, index));
      days.push(day(date.toISOString().slice(0, 10)));
    }
    const labels = monthLabelsForWeeks(weeksFromDays(days));
    expect(labels[0]).toEqual({ index: 0, label: 'ene' });
    expect(labels.some((label) => label.label === 'feb')).toBe(true);
  });
});

describe('fetchGithubContributions', () => {
  it('returns an empty series when username is missing', async () => {
    const result = await fetchGithubContributions(null);
    expect(result).toEqual({ username: '', profileUrl: 'https://github.com/', total: 0, days: [] });
  });

  it('uses the JSON API when it returns days', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        total: { lastYear: 4 },
        contributions: [{ date: '2026-01-01', count: 4, level: 2 }],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchGithubContributions('ojoanalogo');
    expect(result.total).toBe(4);
    expect(result.days).toEqual([day('2026-01-01', 4, 2)]);
    expect(result.profileUrl).toBe('https://github.com/ojoanalogo');
    expect(String(fetchMock.mock.calls[0][0])).toContain('ojoanalogo');
  });

  it('falls back to GitHub HTML when the JSON API is empty', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contributions: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => '<td data-date="2026-02-01" data-level="3" data-count="8"></td>',
      });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchGithubContributions('ojoanalogo');
    expect(result.days).toEqual([day('2026-02-01', 8, 3)]);
    expect(result.total).toBe(8);
  });

  it('returns an empty series when both sources fail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const result = await fetchGithubContributions('ojoanalogo');
    expect(result.days).toEqual([]);
    expect(result.username).toBe('ojoanalogo');
  });
});
