import { GithubLogoIcon } from '@phosphor-icons/react';
import { postDateFormatter } from '@/config/postFormatting';
import {
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
  if (day.count === 1) return `1 contribución el ${when}`;
  return `${day.count} contribuciones el ${when}`;
}

function ContributionCell({ day }: { day: ContributionDay | null }) {
  if (!day) {
    return <span className="block size-2 rounded-[2px] bg-transparent" aria-hidden />;
  }
  return (
    <span
      className={`block size-2 rounded-[2px] ${LEVEL_CLASS[day.level]}`}
      title={cellTitle(day)}
    />
  );
}

export default function ContributionGraph({
  contributions,
}: {
  contributions: GithubContributions;
}) {
  const weeks = weeksFromDays(contributions.days);
  if (weeks.length === 0) return null;

  const monthLabels = monthLabelsForWeeks(weeks);
  const monthByIndex = new Map(monthLabels.map((label) => [label.index, label.label]));
  const totalLabel = `${numberFormatter.format(contributions.total)} contribuciones el último año`;

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
                    <ContributionCell key={day?.date ?? `pad-${weekIndex}-${dayIndex}`} day={day} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 text-[0.65rem] text-muted">
        <span>{totalLabel}</span>
        <span className="flex items-center gap-1" aria-hidden>
          menos
          {([0, 1, 2, 3, 4] as ContributionLevel[]).map((level) => (
            <span key={level} className={`size-2 rounded-[2px] ${LEVEL_CLASS[level]}`} />
          ))}
          más
        </span>
      </div>
    </div>
  );
}
