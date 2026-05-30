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
      className="desktop-taskbar__clock"
      dateTime={now.toISOString()}
      title={now.toLocaleString('es-MX')}
    >
      <span className="desktop-taskbar__clock-time">{timeFormatter.format(now)}</span>
      <span className="desktop-taskbar__clock-date">{dateFormatter.format(now)}</span>
    </time>
  );
}
