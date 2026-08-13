import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { postDateFormatter } from '@/config/postFormatting';
import type { GithubContributions } from '@/lib/githubContributions';
import ContributionGraph from './ContributionGraph';

function contributions(overrides: Partial<GithubContributions> = {}): GithubContributions {
  return {
    username: 'ojoanalogo',
    profileUrl: 'https://github.com/ojoanalogo',
    total: 12,
    days: [
      { date: '2026-01-04', count: 0, level: 0 },
      { date: '2026-01-05', count: 3, level: 2 },
    ],
    ...overrides,
  };
}

describe('ContributionGraph', () => {
  it('renders nothing when there are no days', () => {
    const { container } = render(<ContributionGraph contributions={contributions({ days: [] })} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows the yearly total and a profile link', () => {
    render(<ContributionGraph contributions={contributions()} />);
    expect(screen.getByRole('img', { name: '12 contribuciones el último año' })).toBeTruthy();
    const link = screen.getByRole('link', { name: 'Ver perfil de GitHub ojoanalogo' });
    expect(link.getAttribute('href')).toBe('https://github.com/ojoanalogo');
    expect(screen.getByText('@ojoanalogo')).toBeTruthy();
  });

  it('titles cells with the contribution count', () => {
    const { container } = render(<ContributionGraph contributions={contributions()} />);
    const when = postDateFormatter.format(new Date('2026-01-05T00:00:00Z'));
    expect(container.querySelector(`[title="3 contribuciones el ${when}"]`)).toBeTruthy();
  });
});
