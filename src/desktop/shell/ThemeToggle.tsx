import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { MoonIcon, SunIcon, SystemIcon } from './icons/ThemeIcons';
import { useTheme } from '../state/ThemeContext';

export default function ThemeToggle({ className }: { className?: string }) {
  const { isDark, preference, toggleTheme } = useTheme();
  const prefersReduced = useReducedMotion();
  const followingSystem = preference === 'system';
  const iconKey = followingSystem ? 'system' : isDark ? 'moon' : 'sun';

  const transition = prefersReduced ? { duration: 0 } : { duration: 0.1, ease: 'easeOut' as const };

  return (
    <button
      type="button"
      aria-label={
        followingSystem
          ? `Tema del sistema (${isDark ? 'oscuro' : 'claro'}). Clic para fijar manualmente.`
          : isDark
            ? 'Cambiar a modo claro'
            : 'Cambiar a modo oscuro'
      }
      title={
        followingSystem
          ? `Tema del sistema (${isDark ? 'oscuro' : 'claro'}). Clic para fijar manualmente.`
          : `Tema fijado (${isDark ? 'oscuro' : 'claro'}). Clic para alternar.`
      }
      data-tooltip="Cambiar tema"
      onClick={toggleTheme}
      className={[
        'tooltip grid cursor-pointer place-items-center p-1 text-secondary transition-colors duration-200 hover:text-primary',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <AnimatePresence mode="sync" initial={false}>
        <motion.span
          key={iconKey}
          className="grid place-items-center"
          initial={prefersReduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition}
        >
          {followingSystem ? <SystemIcon /> : isDark ? <MoonIcon /> : <SunIcon />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
