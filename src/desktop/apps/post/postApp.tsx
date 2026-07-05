import { lazy, Suspense } from 'react';
import { defineApp, type AppDefinition } from '@desktop/wrappers';
import type { BlogPostSummary } from '../../types';
import { postWindowId, postSlugFromWindowId } from '../../lib/appIds';
import AppLoading from '../AppLoading';

const PostContent = lazy(() => import('./PostContent'));

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
      body: () => (
        <Suspense fallback={<AppLoading />}>
          <PostContent post={post} />
        </Suspense>
      ),
    }),
  );
}

export function findPostBySlug(posts: BlogPostSummary[], windowId: string) {
  const slug = postSlugFromWindowId(windowId);
  return posts.find((post) => post.slug === slug);
}
