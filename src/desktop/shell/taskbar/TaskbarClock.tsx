import { useEffect, useState } from 'react';

const timeFormatter = new Intl.DateTimeFormat('es-MX', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

export default function TaskbarClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();

    const msUntilNextMinute = 60_000 - (Date.now() % 60_000);
    let intervalId: number | undefined;

    const timeoutId = window.setTimeout(() => {
      tick();
      intervalId = window.setInterval(tick, 60_000);
    }, msUntilNextMinute);

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, []);

  return (
    <time
      className="taskbar-clock flex h-6 cursor-default flex-col items-end justify-center gap-0 border border-transparent px-2 font-[inherit] text-[0.6875rem] leading-none text-secondary select-none hover:border-[color:var(--color-hairline)] hover:bg-[var(--color-control-fill)] hover:text-primary max-sm:px-1 dark:hover:bg-[rgb(24_24_27/0.75)]"
      dateTime={now.toISOString()}
      title={now.toLocaleString('es-MX')}
    >
      <span className="whitespace-nowrap tabular-nums">{timeFormatter.format(now)}</span>
      <span className="taskbar-clock__date text-[0.5625rem] whitespace-nowrap text-muted capitalize max-sm:hidden">
        {dateFormatter.format(now)}
      </span>
    </time>
  );
}
