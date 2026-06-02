import { Monitor, Moon, Sun, type LucideProps } from 'lucide-react';

type ThemeIconProps = Pick<LucideProps, 'className'>;

const STROKE = 2;

export function SunIcon({ className = 'h-4 w-4' }: ThemeIconProps) {
  return <Sun className={className} strokeWidth={STROKE} aria-hidden />;
}

export function MoonIcon({ className = 'h-4 w-4' }: ThemeIconProps) {
  return <Moon className={className} strokeWidth={STROKE} aria-hidden />;
}

export function SystemIcon({ className = 'h-4 w-4' }: ThemeIconProps) {
  return <Monitor className={className} strokeWidth={STROKE} aria-hidden />;
}
