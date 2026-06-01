import type { ExplorerViewMode } from './types';

interface LayoutSwitcherProps {
  mode: ExplorerViewMode;
  onChange: (mode: ExplorerViewMode) => void;
}

const SWITCH_BTN =
  'box-border inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-[0.125rem] border p-0 font-[inherit] text-[0.6875rem] leading-none hover:border-[rgb(113_113_122/0.65)] hover:text-primary';
const SWITCH_BTN_ACTIVE =
  'border-[color:var(--color-highlight-border)] bg-[var(--color-highlight-bg)] text-primary';
const SWITCH_BTN_IDLE =
  'border-[color:var(--color-hairline-strong)] bg-[rgb(255_255_255/0.5)] text-muted dark:border-[rgb(113_113_122/0.5)] dark:bg-[rgb(24_24_27/0.55)]';

export default function LayoutSwitcher({ mode, onChange }: LayoutSwitcherProps) {
  return (
    <div
      className="inline-flex items-center gap-[0.1875rem] border-0 bg-transparent p-0 shadow-none"
      role="toolbar"
      aria-label="Cambiar vista"
    >
      <button
        type="button"
        className={`${SWITCH_BTN} ${mode === 'grid' ? SWITCH_BTN_ACTIVE : SWITCH_BTN_IDLE}`}
        aria-pressed={mode === 'grid'}
        title="Vista de iconos"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => onChange('grid')}
      >
        ⊞
      </button>
      <button
        type="button"
        className={`${SWITCH_BTN} ${mode === 'list' ? SWITCH_BTN_ACTIVE : SWITCH_BTN_IDLE}`}
        aria-pressed={mode === 'list'}
        title="Vista de lista"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => onChange('list')}
      >
        ☰
      </button>
    </div>
  );
}
