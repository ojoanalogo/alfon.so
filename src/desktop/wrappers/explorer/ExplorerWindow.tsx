import type { ReactNode } from 'react';
import { ExplorerViewProvider, useExplorerView } from './ExplorerViewContext';
import type { ExplorerViewMode } from './types';
import ExplorerTitleContent from './ExplorerTitleContent';
import Window, { type WindowProps } from '../../window';

type ExplorerWindowProps = Omit<WindowProps, 'titleContent' | 'children'> & {
  defaultMode?: ExplorerViewMode;
  children: ReactNode;
};

function ExplorerWindowInner({
  title,
  bodyClassName,
  children,
  ...windowProps
}: Omit<ExplorerWindowProps, 'defaultMode'>) {
  const { mode } = useExplorerView();

  const mergedBodyClassName = [
    bodyClassName,
    mode === 'list' ? 'card-body--explorer-list' : 'card-body--explorer-grid',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Window
      {...windowProps}
      title={title}
      titleContent={<ExplorerTitleContent title={title} />}
      bodyClassName={mergedBodyClassName}
    >
      {children}
    </Window>
  );
}

export default function ExplorerWindow({ defaultMode = 'grid', ...props }: ExplorerWindowProps) {
  return (
    <ExplorerViewProvider defaultMode={defaultMode}>
      <ExplorerWindowInner {...props} />
    </ExplorerViewProvider>
  );
}
