import type { ReactNode } from 'react';

/**
 * Shared building blocks for the Settings app sections, so a new section
 * composes the same group/row/segmented primitives instead of re-deriving the
 * class strings. Styling stays inline (Tailwind); only genuinely un-utility-able
 * rules live in global.css.
 */

/** Rounded, bordered container that groups related settings rows. */
export const SETTINGS_GROUP =
  'overflow-hidden rounded-lg border border-[color:var(--color-hairline)] bg-[rgb(255_255_255/0.42)] dark:bg-[rgb(24_24_27/0.55)]';

/** A label + optional hint on the left, a control on the right. */
export function SettingsRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-[0.625rem]">
      <div className="min-w-0">
        <span className="block text-[0.6875rem] text-primary">{label}</span>
        {hint && <span className="mt-[0.125rem] block text-[0.5625rem] text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

const SEG =
  'inline-flex shrink-0 gap-[0.125rem] rounded-[0.4375rem] border border-[color:var(--color-hairline)] bg-[rgb(113_113_122/0.12)] p-[0.125rem]';
const SEG_OPTION =
  'inline-flex cursor-pointer items-center gap-[0.3125rem] rounded-[0.3125rem] border px-[0.5625rem] py-[0.3125rem] text-[0.625rem] leading-none whitespace-nowrap';
const SEG_ACTIVE =
  'border-[color:var(--color-hairline)] bg-[rgb(255_255_255/0.82)] font-semibold text-primary shadow-[0_1px_2px_rgb(0_0_0/0.08)] dark:bg-[rgb(39_39_42)] dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]';
const SEG_IDLE = 'border-transparent text-muted hover:text-primary';
const SEG_ICON = 'inline-flex shrink-0 items-center justify-center leading-none';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

/** A single-select pill group (theme, icon size, spacing, sort, label tone…). */
const TOGGLE_TRACK =
  'relative inline-flex h-[1.125rem] w-[1.875rem] shrink-0 cursor-pointer rounded-full border border-[color:var(--color-hairline)] bg-[rgb(113_113_122/0.2)] p-[0.125rem] transition-colors';
const TOGGLE_THUMB =
  'block h-[0.75rem] w-[0.75rem] rounded-full bg-white shadow-[0_1px_2px_rgb(0_0_0/0.18)] transition-transform dark:bg-[rgb(228_228_231)]';
const TOGGLE_ON = 'bg-[color:var(--color-highlight-border)]';

/** On/off switch for boolean settings rows. */
export function SettingsToggle({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={`${TOGGLE_TRACK} ${checked ? TOGGLE_ON : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span
        className={TOGGLE_THUMB}
        style={{ transform: checked ? 'translateX(0.75rem)' : 'translateX(0)' }}
        aria-hidden="true"
      />
    </button>
  );
}

export function SegmentedControl<T extends string>({
  options,
  selected,
  onChange,
  ariaLabel,
}: {
  options: ReadonlyArray<SegmentedOption<T>>;
  selected: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div className={SEG} role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`${SEG_OPTION} ${selected === option.value ? SEG_ACTIVE : SEG_IDLE}`}
          aria-pressed={selected === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.icon ? (
            <span className={SEG_ICON} aria-hidden="true">
              {option.icon}
            </span>
          ) : null}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}
