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
      className="flex cursor-default flex-col items-end gap-0 border border-transparent px-2 py-[0.125rem] font-[inherit] text-[0.6875rem] leading-[1.2] text-secondary select-none hover:border-[color:var(--color-hairline)] hover:bg-[var(--color-control-fill)] hover:text-primary dark:hover:bg-[rgb(24_24_27/0.75)] max-sm:px-1 max-sm:py-[0.125rem]"
      dateTime={now.toISOString()}
      title={now.toLocaleString('es-MX')}
    >
      <span className="tabular-nums whitespace-nowrap">{timeFormatter.format(now)}</span>
      <span className="text-[0.5625rem] whitespace-nowrap text-muted capitalize max-sm:hidden">
        {dateFormatter.format(now)}
      </span>
    </time>
  );
}
