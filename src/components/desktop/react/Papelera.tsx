const TRASH_EMPTY_SRC = '/icons/desktop/trash.svg';
const TRASH_FULL_SRC = '/icons/desktop/trash-full.svg';

interface PapeleraProps {
  trashedCount: number;
  onOpen: () => void;
}

export default function Papelera({ trashedCount, onOpen }: PapeleraProps) {
  const iconSrc = trashedCount > 0 ? TRASH_FULL_SRC : TRASH_EMPTY_SRC;

  return (
    <div className="papelera">
      <button type="button" className="papelera__trigger" onClick={onOpen} aria-label="Papelera">
        <span className="papelera__graphic" aria-hidden="true">
          <img
            src={iconSrc}
            alt=""
            width={32}
            height={32}
            className="papelera__icon"
            loading="lazy"
            decoding="async"
          />
        </span>
        <span className="papelera__label">Papelera</span>
      </button>
    </div>
  );
}
