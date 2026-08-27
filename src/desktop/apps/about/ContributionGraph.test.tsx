import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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

  it('shows the yearly total, streak, and a profile link', () => {
    render(<ContributionGraph contributions={contributions()} />);
    expect(screen.getByRole('img', { name: '12 contribuciones el último año' })).toBeTruthy();
    expect(screen.getByText('· racha de 1 día')).toBeTruthy();
    const link = screen.getByRole('link', { name: 'Ver perfil de GitHub ojoanalogo' });
    expect(link.getAttribute('href')).toBe('https://github.com/ojoanalogo');
    expect(screen.getByText('@ojoanalogo')).toBeTruthy();
  });

  it('shows a tooltip with a Spanish short-month date and activity', () => {
    const { container } = render(<ContributionGraph contributions={contributions()} />);
    const cell = container.querySelector('[data-date="2026-01-05"]');
    expect(cell).not.toBeNull();
    fireEvent.mouseEnter(cell!);
    expect(screen.getByRole('tooltip', { name: '3 contribuciones el 5 ene 2026' })).toBeTruthy();
    fireEvent.mouseLeave(cell!);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('describes empty days in the tooltip', () => {
    const { container } = render(<ContributionGraph contributions={contributions()} />);
    const cell = container.querySelector('[data-date="2026-01-04"]');
    expect(cell).not.toBeNull();
    fireEvent.mouseEnter(cell!);
    expect(screen.getByRole('tooltip', { name: 'Sin contribuciones el 4 ene 2026' })).toBeTruthy();
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
    expect(screen.getByTitle('Récord: 2 días').textContent).toBe('· racha de 1 día');
  });

  it('glows only the strongest contribution days', () => {
    const { container } = render(
      <ContributionGraph
        contributions={contributions({
          days: [
            { date: '2026-01-04', count: 0, level: 0 },
            { date: '2026-01-05', count: 3, level: 2 },
            { date: '2026-01-06', count: 12, level: 4 },
          ],
        })}
      />,
    );
    expect(container.querySelector('[data-date="2026-01-06"]')?.className).toContain(
      'contribution-cell--strong',
    );
    expect(container.querySelector('[data-date="2026-01-05"]')?.className).not.toContain(
      'contribution-cell--strong',
    );
  });
});
