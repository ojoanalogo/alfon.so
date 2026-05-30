import { useWallpaper } from './context/WallpaperContext';
import { resolveIconUrl } from '../../../lib/desktopIcons';

const TRASH_EMPTY_KEY = 'trash';
const TRASH_FULL_KEY = 'trash-full';

interface PapeleraProps {
  trashedCount: number;
  iconUrls: Record<string, string>;
  onOpen: () => void;
}

export default function Papelera({ trashedCount, iconUrls, onOpen }: PapeleraProps) {
  const { iconLabelTone } = useWallpaper();
  const iconSrc =
    trashedCount > 0
      ? resolveIconUrl(iconUrls, TRASH_FULL_KEY)
      : resolveIconUrl(iconUrls, TRASH_EMPTY_KEY);

  return (
    <div className={['papelera', `papelera--labels-${iconLabelTone}`].join(' ')}>
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
