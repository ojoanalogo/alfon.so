import { explorerApp } from '@desktop/wrappers';
import type { ListItem } from '../../wrappers/explorer/types';
import { PROJECTS } from './data';

export default explorerApp({
  id: 'projects',
  title: 'proyectos',
  iconKey: 'projects',
  items: () =>
    PROJECTS.map<ListItem>((project) => ({
      id: project.title,
      label: project.title,
      kind: 'Proyecto',
      graphic: project.icon,
      title: project.description,
      disabled: !project.link,
    })),
  onActivate: (id, ctx) => {
    const project = PROJECTS.find((entry) => entry.title === id);
    if (project?.link) ctx.onOpenLink(project.link);
  },
  geometry: { defaultX: 128, defaultY: 64, defaultWidth: 576, initialZ: 12 },
  desktopIcon: { label: 'proyectos', tooltip: 'Mis proyectos' },
  taskbarTooltip: 'Proyectos',
});
