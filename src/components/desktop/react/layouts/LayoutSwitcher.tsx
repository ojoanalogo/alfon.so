export type ExplorerViewMode = 'grid' | 'list';

interface LayoutSwitcherProps {
  mode: ExplorerViewMode;
  onChange: (mode: ExplorerViewMode) => void;
}

export default function LayoutSwitcher({ mode, onChange }: LayoutSwitcherProps) {
  return (
    <div className="layout-switcher" role="toolbar" aria-label="Cambiar vista">
      <button
        type="button"
        className={['layout-switcher__btn', mode === 'grid' && 'is-active'].filter(Boolean).join(' ')}
        aria-pressed={mode === 'grid'}
        title="Vista de iconos"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => onChange('grid')}
      >
        ⊞
      </button>
      <button
        type="button"
        className={['layout-switcher__btn', mode === 'list' && 'is-active'].filter(Boolean).join(' ')}
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
