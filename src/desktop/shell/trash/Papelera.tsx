import type { RefObject } from 'react';
import { useResolvedIconLabelTone } from '../../lib/useResolvedIconLabelTone';
import { resolveIconUrl } from '@desktop/lib/desktopIcons';

interface PapeleraProps {
  trashedCount: number;
  iconUrls: Record<string, string>;
  onOpen: () => void;
  trashRef: RefObject<HTMLButtonElement | null>;
  suppressNextClickRef: RefObject<boolean>;
}

export default function Papelera({
  iconUrls,
  onOpen,
  trashRef,
  suppressNextClickRef,
}: PapeleraProps) {
  const iconLabelTone = useResolvedIconLabelTone();
  const iconSrc = resolveIconUrl(iconUrls, 'trash');

  return (
    <div
      className={[
        'pointer-events-none fixed right-[max(1rem,env(safe-area-inset-right,0px))] bottom-[calc(3.25rem+env(safe-area-inset-bottom,0px))] z-[1] max-sm:right-[max(0.5rem,env(safe-area-inset-right,0px))] max-sm:bottom-[calc(3rem+env(safe-area-inset-bottom,0px))]',
        `papelera--labels-${iconLabelTone}`,
      ].join(' ')}
    >
      <button
        ref={trashRef}
        type="button"
        className="papelera__trigger pointer-events-auto flex w-20 cursor-pointer flex-col items-center gap-[0.375rem] border border-transparent bg-transparent p-1 text-center font-[ui-monospace,monospace] text-primary transition-[transform,background-color,border-color] duration-150 ease-[ease] active:scale-[0.97]"
        onClick={() => {
          if (suppressNextClickRef.current) {
            suppressNextClickRef.current = false;
            return;
          }
          onOpen();
        }}
        aria-label="Papelera"
      >
        <span className="flex h-8 w-8 items-center justify-center" aria-hidden="true">
          <img
            src={iconSrc}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 object-contain [filter:drop-shadow(1px_2px_0_rgb(0_0_0/0.12))] [image-rendering:pixelated]"
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
