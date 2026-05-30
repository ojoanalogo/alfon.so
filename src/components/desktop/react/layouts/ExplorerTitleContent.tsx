import { useExplorerView } from '../context/ExplorerViewContext';
import LayoutSwitcher from './LayoutSwitcher';

interface ExplorerTitleContentProps {
  title: string;
}

export default function ExplorerTitleContent({ title }: ExplorerTitleContentProps) {
  const { mode, setMode } = useExplorerView();

  return (
    <>
      <span className="window-titlebar__title window-titlebar__title--explorer">{title}</span>
      <div
        className="window-titlebar__toolbar"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <LayoutSwitcher mode={mode} onChange={setMode} />
      </div>
    </>
  );
}
