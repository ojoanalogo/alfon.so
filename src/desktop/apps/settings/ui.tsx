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
