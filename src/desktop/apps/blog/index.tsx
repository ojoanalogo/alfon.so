import { explorerApp } from '@desktop/wrappers';
import type { ListItem } from '../../wrappers/explorer/types';

export default explorerApp({
  id: 'blog',
  title: '✍️ últimos posts',
  iconKey: 'blog',
  defaultMode: 'list',
  items: (ctx) =>
    ctx.posts.map<ListItem>((post) => ({
      id: post.slug,
      label: post.title,
      kind: 'Post',
      iconSrc: ctx.iconUrls.blog,
      title: post.description ?? post.title,
    })),
  onActivate: (id, ctx) => ctx.onOpenPost(id),
  availableWhen: (ctx) => ctx.posts.length > 0,
  geometry: { defaultX: 160, defaultY: 96, defaultWidth: 576, initialZ: 13 },
  desktopIcon: { label: 'blog.sql', tooltip: 'Mis posts' },
  taskbarTooltip: 'Blog',
});
