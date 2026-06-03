import { createElement } from 'react';
import { defineApp, type AppDefinition } from '@desktop/wrappers';
import type { BlogPostSummary } from '../../types';
import { postWindowId, postSlugFromWindowId } from '../postWindow';
import PostContent from './PostContent';

/** One `AppDefinition` per blog post (dynamic window + taskbar entry). */
export function createPostApps(posts: BlogPostSummary[]): AppDefinition[] {
  return posts.map((post, index) =>
    defineApp({
      id: postWindowId(post.slug),
      title: `${post.slug}.md`,
      iconKey: 'blog',
      geometry: {
        defaultWidth: 640,
        initialZ: 20 + index,
      },
      desktopIcon: false,
      taskbarTooltip: post.title,
      body: () => createElement(PostContent, { post }),
    }),
  );
}

export function findPostBySlug(posts: BlogPostSummary[], windowId: string) {
  const slug = postSlugFromWindowId(windowId);
  return posts.find((post) => post.slug === slug);
}
