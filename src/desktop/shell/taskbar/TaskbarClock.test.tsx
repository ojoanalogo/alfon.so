import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import TaskbarClock from './TaskbarClock';

const timeFormatter = new Intl.DateTimeFormat('es-MX', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

afterEach(() => {
  vi.useRealTimers();
});

describe('TaskbarClock', () => {
  it('renders a <time> element with the current formatted time and date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-02T13:37:00'));

    const { container } = render(<TaskbarClock />);
    const timeEl = container.querySelector('time');

    expect(timeEl).toBeTruthy();
    // time string for 13:37 should be shown via the formatter
    expect(screen.getByText(timeFormatter.format(new Date('2026-06-02T13:37:00')))).toBeTruthy();
  });

  it('sets dateTime to an ISO string matching the rendered moment', () => {
    vi.useFakeTimers();
    const moment = new Date('2026-06-02T13:37:00');
    vi.setSystemTime(moment);

    const { container } = render(<TaskbarClock />);
    const timeEl = container.querySelector('time') as HTMLTimeElement;

    expect(timeEl.getAttribute('dateTime')).toBe(moment.toISOString());
  });

  it('updates the displayed time when the minute boundary timeout fires', () => {
    vi.useFakeTimers();
    // 13:37:00.000 -> next minute boundary is in exactly 60_000ms
    vi.setSystemTime(new Date('2026-06-02T13:37:00.000'));

    const { container } = render(<TaskbarClock />);
    const initial = (container.querySelector('time') as HTMLTimeElement).querySelector('span')!
      .textContent;

    // advance to 13:38 — the setTimeout(msUntilNextMinute) should fire and tick().
    // advanceTimersByTime also advances the fake Date clock, so new Date() reads 13:38.
    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    const updated = (container.querySelector('time') as HTMLTimeElement).querySelector('span')!
      .textContent;

    expect(updated).not.toBe(initial);
    expect(updated).toBe(timeFormatter.format(new Date('2026-06-02T13:38:00.000')));
  });

  it('keeps updating every 60s via the interval after the first boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-02T13:37:00.000'));

    const { container } = render(<TaskbarClock />);

    // fire the boundary timeout (-> 13:38, starts interval)
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    // fire the interval once (-> 13:39)
    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    const text = (container.querySelector('time') as HTMLTimeElement).querySelector('span')!
      .textContent;

    expect(text).toBe(timeFormatter.format(new Date('2026-06-02T13:39:00.000')));
  });

  it('clears its timers on unmount (no pending tick after teardown)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-02T13:37:00.000'));
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

    const { unmount } = render(<TaskbarClock />);
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
