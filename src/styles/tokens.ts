/**
 * Cross-layer style tokens shared by Astro components and React desktop shells.
 *
 * Keep these as plain class strings (not Tailwind config) so they remain
 * statically analyzable by the JIT and usable inside both .astro and .tsx files.
 */

export const BORDER_DEFAULT = 'border-gray-400/50 dark:border-gray-400/30';
export const BORDER_SUBTLE = 'border-gray-300/50 dark:border-gray-700/50';
export const BORDER_STRONG = 'border-gray-300 dark:border-gray-600';

/** The glassy card surface used by Card.astro and the desktop Window chrome. */
export const CARD_BASE = [
  'rounded-lg border bg-white/70 font-mono text-sm backdrop-blur-lg',
  'transition-all duration-300 hover:shadow-sm',
  'dark:bg-black/10 dark:hover:shadow-md dark:hover:shadow-black/20',
  BORDER_DEFAULT,
].join(' ');

/** Card variant with the standard inner padding (used by static .astro Card). */
export const CARD_PADDED = `${CARD_BASE} p-4 sm:p-6`;

/** Card variant with no padding — the desktop Window paints its own body. */
export const CARD_FLAT = `${CARD_BASE} p-0 overflow-hidden`;

const ACTION_BTN_BASE =
  'cursor-pointer border border-[rgb(113_113_122/0.4)] bg-[rgb(255_255_255/0.4)] px-2 py-1 font-[inherit] text-[0.65rem] hover:text-primary dark:bg-[rgb(0_0_0/0.2)]';

/** Compact secondary button used in window footers (explorer actions, settings). */
export const WINDOW_ACTION_BTN = `${ACTION_BTN_BASE} text-secondary hover:border-[color:var(--color-highlight-border)]`;

/** Destructive variant — red label, red hover border. */
export const WINDOW_ACTION_BTN_DESTRUCTIVE = `${ACTION_BTN_BASE} text-[rgb(220_38_38)] hover:border-[rgb(220_38_38)] dark:text-[rgb(248_113_113)]`;
