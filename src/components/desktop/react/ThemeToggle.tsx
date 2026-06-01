import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { MoonIcon, SunIcon } from './icons/ThemeIcons';
import { useTheme } from './useTheme';

export default function ThemeToggle({ className }: { className?: string }) {
  const { isDark, toggleTheme } = useTheme();
  const prefersReduced = useReducedMotion();

  const transition = prefersReduced
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 500, damping: 30, mass: 0.6 };

  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      data-tooltip="Cambiar tema"
      onClick={toggleTheme}
      className={[
        'theme-toggle tooltip grid cursor-pointer place-items-center p-1 text-secondary transition-colors duration-200 hover:text-primary',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Swap the sun/moon with a rotating "flip" — mirrors the motion language of the rest of the shell. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? 'moon' : 'sun'}
          className="grid place-items-center"
          initial={prefersReduced ? false : { rotate: -90, scale: 0, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={prefersReduced ? { opacity: 0 } : { rotate: 90, scale: 0, opacity: 0 }}
          transition={transition}
        >
          {isDark ? <MoonIcon /> : <SunIcon />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
