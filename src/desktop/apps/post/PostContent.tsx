import { Divider } from '@desktop/ui/parts';
import { PROSE_CLASS_BASE } from '@/styles/proseConfig';
import { postLongDateFormatter } from '@/config/postFormatting';
import type { BlogPostSummary } from '../../types';

export default function PostContent({ post }: { post: BlogPostSummary }) {
  const date = new Date(post.publishDate);

  return (
    <div>
      {post.heroImageSrc && (
        <img
          src={post.heroImageSrc}
          alt={post.heroImageAlt ?? post.title}
          className="mb-6 w-full rounded-xl shadow-sm"
          loading="lazy"
          decoding="async"
        />
      )}

      <header className="mb-6">
        <h1 className="mb-4 text-3xl leading-tight font-bold text-primary sm:text-4xl">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-sm text-muted">
          <time dateTime={date.toISOString()}>{postLongDateFormatter.format(date)}</time>
          {post.readingTime && <span>· {post.readingTime}</span>}
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded border border-gray-400/40 bg-black/[0.05] px-2 py-0.5 text-xs text-secondary dark:bg-white/[0.08]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </header>

      <Divider className="my-6" />

      <article className={PROSE_CLASS_BASE} dangerouslySetInnerHTML={{ __html: post.html }} />

      <footer className="mt-8 border-t border-gray-300/50 pt-4 text-right dark:border-gray-700/50">
        <a
          className="text-xs text-primary hover:text-accent hover:underline"
          href={`/blog/${post.slug}/`}
          target="_blank"
          rel="noopener noreferrer"
        >
          abrir permalink →
        </a>
      </footer>
    </div>
  );
}
