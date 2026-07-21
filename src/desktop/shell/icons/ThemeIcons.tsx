import { Moon, Sun, type LucideProps } from 'lucide-react';

type ThemeIconProps = Pick<LucideProps, 'className'>;

const STROKE = 2;

export function SunIcon({ className = 'h-4 w-4' }: ThemeIconProps) {
  return <Sun className={className} strokeWidth={STROKE} aria-hidden />;
}

export function MoonIcon({ className = 'h-4 w-4' }: ThemeIconProps) {
  return <Moon className={className} strokeWidth={STROKE} aria-hidden />;
}

/** Half-circle “auto” icon — matches the mobile header theme dropdown. */
export function SystemIcon({ className = 'h-4 w-4' }: ThemeIconProps) {
  return (
    <svg
      className={['theme-icon-system', className].filter(Boolean).join(' ')}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" strokeWidth={STROKE} />
      <path fill="currentColor" d="M12 3a9 9 0 0 1 0 18z" />
    </svg>
  );
}
