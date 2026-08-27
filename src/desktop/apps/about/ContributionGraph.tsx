import { useState } from 'react';
import { createPortal } from 'react-dom';
import { FireIcon, GithubLogoIcon } from '@phosphor-icons/react';
import { postDateFormatter } from '@/config/postFormatting';
import {
  contributionStreaks,
  monthLabelsForWeeks,
  weeksFromDays,
  type ContributionDay,
  type ContributionLevel,
  type GithubContributions,
} from '@/lib/githubContributions';
import { ExternalLink } from '@desktop/ui/parts';

const LEVEL_CLASS: Record<ContributionLevel, string> = {
  0: 'bg-stone-300/75 dark:bg-zinc-800',
  1: 'bg-[#9be9a8] dark:bg-[#0e4429]',
  2: 'bg-[#40c463] dark:bg-[#006d32]',
  3: 'bg-[#30a14e] dark:bg-[#26a641]',
  4: 'bg-[#216e39] dark:bg-[#39d353]',
};

const DAY_LABELS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'] as const;
const VISIBLE_DAY_ROWS = new Set([1, 3, 5]);
const numberFormatter = new Intl.NumberFormat('es-MX');

function cellTitle(day: ContributionDay): string {
  const when = postDateFormatter.format(new Date(`${day.date}T00:00:00Z`));
  if (day.count === 0) return `Sin contribuciones el ${when}`;
  if (day.count === 1) return `1 contribución el ${when}`;
  return `${day.count} contribuciones el ${when}`;
}

function formatStreak(current: number): string {
  if (current <= 0) return 'sin racha';
  if (current === 1) return 'racha de 1 día';
  return `racha de ${numberFormatter.format(current)} días`;
}

function formatLongestStreak(longest: number): string {
  if (longest <= 0) return 'Sin récord de racha';
  if (longest === 1) return 'Récord: 1 día';
  return `Récord: ${numberFormatter.format(longest)} días`;
}

function ContributionTooltip({ text, x, y }: { text: string; x: number; y: number }) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      role="tooltip"
      className="pointer-events-none fixed z-[9999] -translate-x-1/2 -translate-y-full rounded-md px-2.5 py-1.5 text-xs whitespace-nowrap"
      style={{
        left: x,
        top: y,
        marginTop: '-0.375rem',
        backgroundColor: 'var(--color-primary)',
        color: 'var(--color-background)',
      }}
    >
      {text}
    </div>,
    document.body,
  );
}

function ContributionCell({
  day,
  onHighlight,
}: {
  day: ContributionDay | null;
  onHighlight: (day: ContributionDay | null, target: HTMLElement | null) => void;
}) {
  if (!day) {
    return <span className="block size-2 rounded-[2px] bg-transparent" aria-hidden />;
  }
  return (
    <span
      data-date={day.date}
      className={`block size-2 rounded-[2px] ${LEVEL_CLASS[day.level]}`}
      onMouseEnter={(event) => onHighlight(day, event.currentTarget)}
      onMouseLeave={() => onHighlight(null, null)}
    />
  );
}

export default function ContributionGraph({
  contributions,
}: {
  contributions: GithubContributions;
}) {
  const weeks = weeksFromDays(contributions.days);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  if (weeks.length === 0) return null;

  const monthLabels = monthLabelsForWeeks(weeks);
  const monthByIndex = new Map(monthLabels.map((label) => [label.index, label.label]));
  const totalLabel = `${numberFormatter.format(contributions.total)} contribuciones el último año`;
  const streaks = contributionStreaks(contributions.days);
  const streakLabel = formatStreak(streaks.current);

  function highlight(day: ContributionDay | null, target: HTMLElement | null) {
    if (!day || !target) {
      setTooltip(null);
      return;
    }
    const rect = target.getBoundingClientRect();
    setTooltip({
      text: cellTitle(day),
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-muted">
          <GithubLogoIcon
            size={14}
            weight="regular"
            className="shrink-0 text-zinc-700 dark:text-zinc-400"
          />
          github
        </span>
        <ExternalLink
          href={contributions.profileUrl}
          label={`Ver perfil de GitHub ${contributions.username}`}
          className="text-[0.65rem] text-link hover:underline focus:outline-none"
        >
          @{contributions.username}
        </ExternalLink>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex min-w-full flex-col gap-1" role="img" aria-label={totalLabel}>
          <div className="flex gap-px pl-3">
            {weeks.map((week, index) => (
              <span
                key={week[0]?.date ?? `month-${index}`}
                className="w-2 text-[0.55rem] leading-none text-muted"
              >
                {monthByIndex.get(index) ?? ''}
              </span>
            ))}
          </div>
          <div className="flex gap-1">
            <div className="flex w-2.5 shrink-0 flex-col gap-px pt-0">
              {DAY_LABELS.map((label, index) => (
                <span key={label} className="h-2 text-[0.55rem] leading-2 text-muted" aria-hidden>
                  {VISIBLE_DAY_ROWS.has(index) ? label : ''}
                </span>
              ))}
            </div>
            <div className="flex gap-px">
              {weeks.map((week, weekIndex) => (
                <div key={week[0]?.date ?? `week-${weekIndex}`} className="flex flex-col gap-px">
                  {week.map((day, dayIndex) => (
                    <ContributionCell
                      key={day?.date ?? `pad-${weekIndex}-${dayIndex}`}
                      day={day}
                      onHighlight={highlight}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[0.65rem] text-muted">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span>{totalLabel}</span>
          <span className="flex items-center gap-0.5" title={formatLongestStreak(streaks.longest)}>
            <FireIcon size={11} weight="fill" className="shrink-0" aria-hidden />
            {streakLabel}
          </span>
        </span>
        <span className="flex items-center gap-1" aria-hidden>
          menos
          {([0, 1, 2, 3, 4] as ContributionLevel[]).map((level) => (
            <span key={level} className={`size-2 rounded-[2px] ${LEVEL_CLASS[level]}`} />
          ))}
          más
        </span>
      </div>
      {tooltip ? <ContributionTooltip text={tooltip.text} x={tooltip.x} y={tooltip.y} /> : null}
    </div>
  );
}
