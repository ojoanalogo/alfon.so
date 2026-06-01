import { useExplorerView } from '../context/ExplorerViewContext';
import LayoutSwitcher from './LayoutSwitcher';

interface ExplorerTitleContentProps {
  title: string;
}

export default function ExplorerTitleContent({ title }: ExplorerTitleContentProps) {
  const { mode, setMode } = useExplorerView();

  return (
    <>
      <span className="min-w-0 flex-1 overflow-hidden text-[0.6875rem] leading-[1.2] whitespace-nowrap text-ellipsis text-muted max-sm:text-[0.625rem]">
        {title}
      </span>
      <div
        className="ml-auto flex shrink-0 items-center"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <LayoutSwitcher mode={mode} onChange={setMode} />
      </div>
    </>
  );
}
