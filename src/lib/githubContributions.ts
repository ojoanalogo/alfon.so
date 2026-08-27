import { SOCIAL_LINKS, type SocialLink } from '@/config';

export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

export interface ContributionDay {
  date: string;
  count: number;
  level: ContributionLevel;
}

export interface GithubContributions {
  username: string;
  profileUrl: string;
  total: number;
  days: ContributionDay[];
}

const FETCH_TIMEOUT_MS = 8_000;
const EMPTY: Omit<GithubContributions, 'username' | 'profileUrl'> = { total: 0, days: [] };

export function githubUsernameFromUrl(url: string): string | null {
  try {
    const { hostname, pathname } = new URL(url);
    if (!hostname.endsWith('github.com')) return null;
    const username = pathname.split('/').filter(Boolean)[0];
    return username ?? null;
  } catch {
    return null;
  }
}

export function githubUsernameFromSocialLinks(links: SocialLink[] = SOCIAL_LINKS): string | null {
  const link = links.find((item) => item.platform === 'github');
  return link ? githubUsernameFromUrl(link.url) : null;
}

export function githubProfileUrl(username: string): string {
  return `https://github.com/${username}`;
}

function asLevel(value: number): ContributionLevel {
  if (value <= 0) return 0;
  if (value >= 4) return 4;
  return value as ContributionLevel;
}

export function parseContributionApiPayload(payload: unknown): ContributionDay[] {
  if (!payload || typeof payload !== 'object') return [];
  const contributions = (payload as { contributions?: unknown }).contributions;
  if (!Array.isArray(contributions)) return [];

  const days: ContributionDay[] = [];
  for (const entry of contributions) {
    if (!entry || typeof entry !== 'object') continue;
    const { date, count, level } = entry as { date?: unknown; count?: unknown; level?: unknown };
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    days.push({
      date,
      count: typeof count === 'number' && count > 0 ? count : 0,
      level: typeof level === 'number' ? asLevel(level) : 0,
    });
  }
  return days.sort((left, right) => left.date.localeCompare(right.date));
}

export function parseGithubContributionsHtml(html: string): ContributionDay[] {
  const byDate = new Map<string, ContributionDay>();
  const tagRe = /<(?:rect|td)\b[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = tagRe.exec(html))) {
    const tag = match[0];
    const date = tag.match(/data-date="(\d{4}-\d{2}-\d{2})"/)?.[1];
    if (!date) continue;
    const levelMatch = tag.match(/data-level="([0-4])"/);
    const countMatch = tag.match(/data-count="(\d+)"/);
    byDate.set(date, {
      date,
      count: countMatch ? Number(countMatch[1]) : 0,
      level: levelMatch ? asLevel(Number(levelMatch[1])) : 0,
    });
  }
  return [...byDate.values()].sort((left, right) => left.date.localeCompare(right.date));
}

export function totalFromPayload(payload: unknown, days: ContributionDay[]): number {
  if (payload && typeof payload === 'object') {
    const total = (payload as { total?: unknown }).total;
    if (total && typeof total === 'object') {
      const lastYear = (total as { lastYear?: unknown }).lastYear;
      if (typeof lastYear === 'number') return lastYear;
      const values = Object.values(total as Record<string, unknown>).filter(
        (value): value is number => typeof value === 'number',
      );
      if (values.length === 1) return values[0];
    }
  }
  return days.reduce((sum, day) => sum + day.count, 0);
}

function emptyContributions(username: string): GithubContributions {
  return { username, profileUrl: githubProfileUrl(username), ...EMPTY };
}

async function fetchJson(url: string): Promise<unknown | null> {
  const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) return null;
  return response.json();
}

async function fetchText(url: string): Promise<string | null> {
  const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) return null;
  return response.text();
}

/** Last-year contribution calendar. Failures return an empty series so builds stay green. */
export async function fetchGithubContributions(
  username: string | null,
): Promise<GithubContributions> {
  if (!username) return emptyContributions('');

  const encoded = encodeURIComponent(username);
  try {
    const payload = await fetchJson(
      `https://github-contributions-api.jogruber.de/v4/${encoded}?y=last`,
    );
    const days = parseContributionApiPayload(payload);
    if (days.length > 0) {
      return {
        username,
        profileUrl: githubProfileUrl(username),
        total: totalFromPayload(payload, days),
        days,
      };
    }
  } catch {
    /* try the public GitHub calendar next */
  }

  try {
    const html = await fetchText(`https://github.com/users/${encoded}/contributions`);
    const days = html ? parseGithubContributionsHtml(html) : [];
    if (days.length > 0) {
      return {
        username,
        profileUrl: githubProfileUrl(username),
        total: days.reduce((sum, day) => sum + day.count, 0),
        days,
      };
    }
  } catch {
    /* empty fallback below */
  }

  return emptyContributions(username);
}

export function weeksFromDays(days: ContributionDay[]): Array<Array<ContributionDay | null>> {
  if (days.length === 0) return [];

  const sorted = [...days].sort((left, right) => left.date.localeCompare(right.date));
  const first = sorted[0];
  const leadingBlanks = new Date(`${first.date}T00:00:00Z`).getUTCDay();
  const padded: Array<ContributionDay | null> = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...sorted,
  ];

  const weeks: Array<Array<ContributionDay | null>> = [];
  for (let index = 0; index < padded.length; index += 7) {
    const slice = padded.slice(index, index + 7);
    while (slice.length < 7) slice.push(null);
    weeks.push(slice);
  }
  return weeks;
}

const MONTH_LABELS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

/** Calendar date in Spanish with a short month, matching the graph axis. */
export function formatContributionDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  return `${date.getUTCDate()} ${MONTH_LABELS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** Consecutive days with at least one contribution. `current` may skip a quiet last day. */
export function contributionStreaks(days: ContributionDay[]): {
  current: number;
  longest: number;
} {
  if (days.length === 0) return { current: 0, longest: 0 };

  const sorted = [...days].sort((left, right) => left.date.localeCompare(right.date));

  let longest = 0;
  let run = 0;
  for (const day of sorted) {
    if (day.count > 0) {
      run += 1;
      if (run > longest) longest = run;
    } else {
      run = 0;
    }
  }

  let index = sorted.length - 1;
  if (sorted[index].count === 0) index -= 1;
  let current = 0;
  while (index >= 0 && sorted[index].count > 0) {
    current += 1;
    index -= 1;
  }

  return { current, longest };
}

export function monthLabelsForWeeks(
  weeks: Array<Array<ContributionDay | null>>,
): Array<{ index: number; label: string }> {
  const labels: Array<{ index: number; label: string }> = [];
  let lastMonth = -1;
  for (let index = 0; index < weeks.length; index += 1) {
    const first = weeks[index].find((day) => day !== null);
    if (!first) continue;
    const month = new Date(`${first.date}T00:00:00Z`).getUTCMonth();
    if (month === lastMonth) continue;
    if (labels.length > 0 && index - labels[labels.length - 1].index < 2) continue;
    labels.push({ index, label: MONTH_LABELS[month] });
    lastMonth = month;
  }
  return labels;
}
