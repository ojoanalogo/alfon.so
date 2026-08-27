import { fireEvent, render, screen } from '@testing-library/react';
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

function formatted(date: string): string {
  return postDateFormatter.format(new Date(`${date}T00:00:00Z`));
}

describe('ContributionGraph', () => {
  it('renders nothing when there are no days', () => {
    const { container } = render(<ContributionGraph contributions={contributions({ days: [] })} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows the yearly total, streak, and a profile link', () => {
    render(<ContributionGraph contributions={contributions()} />);
    expect(screen.getByRole('img', { name: '12 contribuciones el último año' })).toBeTruthy();
    expect(screen.getByText('racha de 1 día')).toBeTruthy();
    const link = screen.getByRole('link', { name: 'Ver perfil de GitHub ojoanalogo' });
    expect(link.getAttribute('href')).toBe('https://github.com/ojoanalogo');
    expect(screen.getByText('@ojoanalogo')).toBeTruthy();
  });

  it('shows a tooltip with the date and activity for a hovered cell', () => {
    const { container } = render(<ContributionGraph contributions={contributions()} />);
    const cell = container.querySelector('[data-date="2026-01-05"]');
    expect(cell).not.toBeNull();
    fireEvent.mouseEnter(cell!);
    expect(
      screen.getByRole('tooltip', { name: `3 contribuciones el ${formatted('2026-01-05')}` }),
    ).toBeTruthy();
    fireEvent.mouseLeave(cell!);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('describes empty days in the tooltip', () => {
    const { container } = render(<ContributionGraph contributions={contributions()} />);
    const cell = container.querySelector('[data-date="2026-01-04"]');
    expect(cell).not.toBeNull();
    fireEvent.mouseEnter(cell!);
    expect(
      screen.getByRole('tooltip', { name: `Sin contribuciones el ${formatted('2026-01-04')}` }),
    ).toBeTruthy();
  });

  it('surfaces the longest streak on the racha label', () => {
    render(
      <ContributionGraph
        contributions={contributions({
          days: [
            { date: '2026-01-01', count: 1, level: 1 },
            { date: '2026-01-02', count: 1, level: 1 },
            { date: '2026-01-03', count: 0, level: 0 },
            { date: '2026-01-04', count: 2, level: 1 },
          ],
        })}
      />,
    );
    expect(screen.getByTitle('Récord: 2 días').textContent).toContain('racha de 1 día');
  });
});
