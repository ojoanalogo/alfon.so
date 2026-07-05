import { Divider, ExternalLink, InfoRow, PostListItem, SocialMediaIcons } from '@desktop/ui/parts';
import { SITE } from '@desktop/lib/siteContent';
import type { BlogPostSummary } from '../../types';
import { TECH_STACK } from '../projects/data';

const ABOUT_LINK_CLASS = 'text-link hover:underline focus:outline-none';

/** How many recent posts to surface in the About card. */
const MAX_ABOUT_POSTS = 3;

interface AboutContentProps {
  /** Latest-first published posts (already sorted upstream). */
  posts?: BlogPostSummary[];
  /** Opens a post in the desktop; omit on the static (mobile) view to link out. */
  onOpenPost?: (slug: string) => void;
}

export default function AboutContent({ posts = [], onOpenPost }: AboutContentProps) {
  const latestPosts = posts.slice(0, MAX_ABOUT_POSTS);
  const person = SITE.person;

  return (
    <div className="mx-auto max-w-2xl space-y-4 text-xs sm:space-y-2">
      <div className="mb-4 flex items-center gap-3">
        <div
          className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-stone-300/70 text-3xl dark:bg-gray-500/10"
          role="img"
          aria-label={`Foto de perfil de ${person.displayName}`}
        >
          🧑‍💻
        </div>
        <div className="flex flex-col gap-1">
          <h1 id="about-heading" className="text-lg">
            👋 ¡hola! soy <span className="font-semibold text-primary">{person.displayName}</span>
          </h1>
          <p className="text-xs text-muted">
            {person.role} · {person.photographer}
          </p>
        </div>
      </div>

      <div className="mb-4 rounded-lg bg-stone-300/70 p-3 dark:bg-gray-500/10">
        <p className="leading-relaxed text-primary">{SITE.welcome.aboutCard}</p>
      </div>

      <Divider className="mb-2" />

      <InfoRow label="ubicación">{person.country} 🇲🇽</InfoRow>

      <InfoRow label="trabajo">
        {person.role} @{' '}
        <ExternalLink
          href={SITE.work.url}
          label={`Visitar sitio web ${SITE.work.host}`}
          className={ABOUT_LINK_CLASS}
        >
          {SITE.work.host}
        </ExternalLink>
      </InfoRow>

      <InfoRow label="hobby">
        fotografía @{' '}
        <ExternalLink
          href={SITE.hobby.url}
          label={`Visitar portafolio de fotografía ${SITE.hobby.host}`}
          className={ABOUT_LINK_CLASS}
        >
          {SITE.hobby.host}
        </ExternalLink>
      </InfoRow>

      <InfoRow label="comunidad">
        {SITE.community.label} @{' '}
        <ExternalLink
          href={SITE.community.url}
          label="Cursor Ambassador Program"
          className={ABOUT_LINK_CLASS}
        >
          {SITE.community.path}
        </ExternalLink>
      </InfoRow>

      <InfoRow label="proyecto actual">
        <ExternalLink
          href={SITE.currentProject.url}
          label="Visitar SofIA - Asistente de finanzas con IA"
          className={ABOUT_LINK_CLASS}
        >
          {SITE.currentProject.name}
        </ExternalLink>{' '}
        - {SITE.currentProject.description}
      </InfoRow>

      <InfoRow label="intereses">{SITE.interests}</InfoRow>

      <InfoRow label="contacto">
        <a
          className={ABOUT_LINK_CLASS}
          href={`mailto:${person.email}`}
          aria-label={`Enviar email a ${person.email}`}
        >
          {person.email}
        </a>
      </InfoRow>

      <InfoRow label="social">
        <SocialMediaIcons />
      </InfoRow>

      <div className="pt-2">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-0">
          <span className="shrink-0 text-muted sm:w-36">tech stack</span>
          <div className="flex flex-wrap gap-2" role="list" aria-label="Tech stack">
            {Object.keys(TECH_STACK).map((lang) => (
              <span
                key={lang}
                className="text-secondary transition-colors hover:text-primary"
                title={TECH_STACK[lang]}
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
      </div>

      {latestPosts.length > 0 && (
        <>
          <Divider className="my-2" />
          <div className="flex flex-col gap-1.5">
            <span className="text-muted">últimos posts</span>
            <ul className="m-0 flex list-none flex-col gap-1 p-0" aria-label="Últimos posts">
              {latestPosts.map((post) => (
                <PostListItem
                  key={post.slug}
                  title={post.title}
                  slug={post.slug}
                  publishDate={post.publishDate}
                  onOpen={onOpenPost ? () => onOpenPost(post.slug) : undefined}
                />
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
