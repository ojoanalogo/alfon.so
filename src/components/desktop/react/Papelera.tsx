import { useResolvedIconLabelTone } from './utils/useResolvedIconLabelTone';
import { resolveIconUrl } from '../../../lib/desktopIcons';

const TRASH_EMPTY_KEY = 'trash';
const TRASH_FULL_KEY = 'trash-full';

interface PapeleraProps {
  trashedCount: number;
  iconUrls: Record<string, string>;
  onOpen: () => void;
}

export default function Papelera({ trashedCount, iconUrls, onOpen }: PapeleraProps) {
  const iconLabelTone = useResolvedIconLabelTone();
  const iconSrc =
    trashedCount > 0
      ? resolveIconUrl(iconUrls, TRASH_FULL_KEY)
      : resolveIconUrl(iconUrls, TRASH_EMPTY_KEY);

  return (
    <div
      className={[
        'pointer-events-none fixed right-4 bottom-[3.25rem] z-[90] max-sm:right-2 max-sm:bottom-12',
        `papelera--labels-${iconLabelTone}`,
      ].join(' ')}
    >
      <button
        type="button"
        className="papelera__trigger pointer-events-auto flex w-20 cursor-pointer flex-col items-center gap-[0.375rem] border border-transparent bg-transparent p-1 text-center font-[ui-monospace,monospace] text-primary transition-transform duration-150 ease-[ease] active:scale-[0.97]"
        onClick={onOpen}
        aria-label="Papelera"
      >
        <span className="flex h-8 w-8 items-center justify-center" aria-hidden="true">
          <img
            src={iconSrc}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 object-contain [image-rendering:pixelated] [filter:drop-shadow(1px_2px_0_rgb(0_0_0/0.12))]"
            loading="lazy"
            decoding="async"
          />
        </span>
        <span className="papelera__label max-w-full px-1 py-[0.125rem] text-[0.625rem] leading-[1.2] [word-break:break-word]">
          Papelera
        </span>
      </button>
    </div>
  );
}
