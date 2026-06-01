import { createElement } from 'react';
import { defineApp } from '@desktop/wrappers';
import type { BlogPostSummary } from '../../types';
import { cascadeOffset } from '../cascade';
import { postWindowId, postSlugFromWindowId } from '../postWindow';
import PostContent from './PostContent';

/**
 * One `AppDefinition` per blog post. Cascaded so windows don't overlap. The
 * registry returns these alongside `APPS` so the rest of the runtime treats
 * post windows like any other app (titles, taskbar entry, geometry).
 */
export function createPostApps(posts: BlogPostSummary[]) {
  return posts.map((post, index) => {
    const offset = cascadeOffset(index, { baseX: 180, baseY: 108, pitch: 28 });
    return defineApp({
      id: postWindowId(post.slug),
      title: `${post.slug}.md`,
      iconKey: 'blog',
      geometry: {
        defaultX: offset.x,
        defaultY: offset.y,
        defaultWidth: 640,
        initialZ: 20 + index,
      },
      desktopIcon: false,
      taskbarTooltip: post.title,
      body: () => createElement(PostContent, { post }),
    });
  });
}

export function isPostApp(id: string): boolean {
  return id.startsWith('post:');
}

export function findPostBySlug(posts: BlogPostSummary[], windowId: string) {
  const slug = postSlugFromWindowId(windowId);
  return posts.find((post) => post.slug === slug);
}
