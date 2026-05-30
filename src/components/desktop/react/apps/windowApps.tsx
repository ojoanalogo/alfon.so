import { useEffect, useState, type ReactNode } from 'react';
import type { BlogPostSummary, WindowDef } from '../types';
import { normalizeBrowserUrl } from '../browserUtils';
import ExplorerLayout, { type ExplorerItem } from '../layouts/ExplorerLayout';
import ListLayout from '../layouts/ListLayout';
import Modal from '../ui/Modal';
import SettingsContent from '../settings/SettingsContent';
import {
  Divider,
  ExternalLink,
  InfoRow,
  PostListItem,
  SocialMediaIcons,
} from '../parts';
import TerminalApp from '../TerminalApp';
import type { TrashController, WindowAppRegistry } from './types';

export const POST_WINDOW_PREFIX = 'post:';
export const BROWSER_WINDOW_ID = 'browser';

export function postWindowId(slug: string) {
  return `${POST_WINDOW_PREFIX}${slug}`;
}

export function createPostWindowDefs(posts: BlogPostSummary[]): WindowDef[] {
  return posts.map((post, index) => ({
    id: postWindowId(post.slug),
    title: `${post.slug}.md`,
    defaultX: 180 + index * 28,
    defaultY: 108 + index * 28,
    defaultWidth: 640,
    initialZ: 20 + index,
  }));
}

export const WINDOW_DEFS: WindowDef[] = [
  {
    id: 'terminal',
    title: 'terminal — guest@alfon.so',
    defaultX: 88,
    defaultY: 36,
    defaultWidth: 560,
    defaultHeight: 380,
    initialZ: 10,
  },
  {
    id: 'about',
    title: 'about.txt',
    defaultX: 0,
    defaultY: 0,
    defaultWidth: 576,
    minWidth: 520,
    defaultOpen: true,
    center: true,
    initialZ: 11,
  },
  {
    id: 'projects',
    title: 'proyectos',
    defaultX: 128,
    defaultY: 64,
    defaultWidth: 576,
    initialZ: 12,
  },
  {
    id: 'blog',
    title: '✍️ últimos posts',
    defaultX: 160,
    defaultY: 96,
    defaultWidth: 576,
    initialZ: 13,
  },
  {
    id: 'area51',
    title: 'area51.pdf — CLASIFICADO',
    defaultX: 220,
    defaultY: 120,
    defaultWidth: 560,
    initialZ: 14,
  },
  {
    id: 'ovnis',
    title: 'ovnis.pdf — SOLO LECTURA',
    defaultX: 250,
    defaultY: 150,
    defaultWidth: 560,
    initialZ: 15,
  },
  {
    id: 'happy',
    title: 'no_abrir.mp4',
    defaultX: 280,
    defaultY: 84,
    defaultWidth: 600,
    initialZ: 16,
  },
  {
    id: 'trash',
    title: '🗑 Papelera',
    defaultX: 320,
    defaultY: 140,
    defaultWidth: 420,
    initialZ: 17,
  },
  {
    id: 'settings',
    title: 'ajustes',
    defaultX: 240,
    defaultY: 72,
    defaultWidth: 580,
    defaultHeight: 420,
    initialZ: 18,
  },
  {
    id: BROWSER_WINDOW_ID,
    title: 'web browser',
    defaultX: 180,
    defaultY: 80,
    defaultWidth: 800,
    initialZ: 30,
  },
];

const TECH_STACK: Record<string, string> = {
  js: 'JavaScript',
  ts: 'TypeScript',
  'node.js': 'Node',
  astro: 'This site is built on astro',
  python: 'Python',
  sql: 'SQL',
  'claude-code': 'Best tool ever',
  'next.js': 'Next.js',
  aws: 'AWS',
  gcp: 'GCP',
  docker: 'Docker',
  tf: 'Terraform',
};

const PROJECTS = [
  {
    title: 'sofia',
    description: 'registra tus gastos con un solo mensaje de WhatsApp.',
    link: 'https://sofinanzas.mx',
    icon: '💸',
  },
  {
    title: 'terminus',
    description:
      'plantilla de Astro para sitios web personales, inspirada en una terminal de comandos.',
    link: 'https://github.com/ojoanalogo/terminus-astro-template',
    icon: '💻',
  },
  {
    title: 'hilitos',
    description: 'marketplaces para pequeños emprendedores, como Etsy.',
    link: 'https://hilitos.app',
    icon: '🧵',
  },
  {
    title: 'dotfiles',
    description: 'dale un vistazo a la configuración de mi equipo personal.',
    link: 'https://github.com/ojoanalogo/dotfiles',
    icon: '🔧',
  },
  {
    title: 'wawa',
    description: 'framework para construir flujos conversacionales en whatsapp.',
    icon: '💬',
    link: '',
  },
];

export function BrowserTitleContent({
  url,
  onReload,
  onNavigate,
}: {
  url: string | null;
  onReload: () => void;
  onNavigate: (url: string) => void;
}) {
  const [draft, setDraft] = useState(url ?? '');

  useEffect(() => {
    setDraft(url ?? '');
  }, [url]);

  function submitAddress() {
    const normalized = normalizeBrowserUrl(draft);
    if (normalized) {
      onNavigate(normalized);
      return;
    }
    if (url) {
      setDraft(url);
    }
  }

  return (
    <div className="browser-titlebar">
      <span className="browser-titlebar__app">web browser</span>
      <button
        type="button"
        className="browser-titlebar__reload"
        title="Recargar"
        aria-label="Recargar página"
        disabled={!url}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onReload();
        }}
      >
        ↻
      </button>
      <div
        className="browser-titlebar__address"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <span className="browser-titlebar__scheme" aria-hidden="true">
          🌐
        </span>
        <input
          type="text"
          className="browser-titlebar__url-input"
          value={draft}
          placeholder="about:blank"
          aria-label="Dirección web"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              submitAddress();
            }
          }}
        />
        {url && (
          <a
            className="browser-titlebar__external"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir en pestaña nueva"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            ↗
          </a>
        )}
      </div>
    </div>
  );
}

function BrowserContent({ url, reloadKey }: { url: string; reloadKey: number }) {
  return (
    <iframe
      key={`${url}-${reloadKey}`}
      title={`web browser — ${url}`}
      src={url}
      className="browser-window__frame"
      sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      referrerPolicy="no-referrer-when-downgrade"
      loading="lazy"
    />
  );
}

function AboutContent() {
  return (
    <div className="space-y-4 text-xs sm:space-y-2">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex flex-col gap-1">
          <h1 id="about-heading" className="text-2xl">
            👋 hola soy <span className="font-medium text-primary">alfonso reyes</span>
          </h1>
          <p className="text-xs text-muted">ingeniero backend / fotógrafo</p>
        </div>
      </div>

      <div className="mb-4 rounded-lg bg-stone-300/70 p-3 dark:bg-gray-500/10">
        <p className="leading-relaxed text-primary">
          bienvenido a mi pequeño rincón en internet, aquí encontrarás mis pensamientos (pocos), mis
          proyectos y mi blog.
        </p>
      </div>

      <Divider className="mb-2" />

      <InfoRow label="ubicación">méxico 🌮🇲🇽</InfoRow>

      <InfoRow label="trabajo">
        ingeniero backend @{' '}
        <ExternalLink href="https://monopolio.com.mx" label="Visitar sitio web monopolio.com.mx">
          monopolio.com.mx
        </ExternalLink>
      </InfoRow>

      <InfoRow label="hobby">
        fotografía @{' '}
        <ExternalLink
          href="https://ojoanalogo.com"
          label="Visitar portafolio de fotografía ojoanalogo.com"
        >
          ojoanalogo.com
        </ExternalLink>
      </InfoRow>

      <InfoRow label="comunidad">
        cursor ambassador @{' '}
        <ExternalLink href="https://cursor.com/ambassadors" label="Cursor Ambassador Program">
          cursor.com/ambassadors
        </ExternalLink>
      </InfoRow>

      <InfoRow label="proyecto actual">
        <ExternalLink
          href="https://sofinanzas.mx"
          label="Visitar SofIA - Asistente de finanzas con IA"
        >
          sofia
        </ExternalLink>{' '}
        - asistente de finanzas personales para todos 💸
      </InfoRow>

      <InfoRow label="intereses">
        programación, startups, ciencia ficción, películas, fotografía, viajes
      </InfoRow>

      <InfoRow label="contacto">
        <a
          className="text-primary hover:text-accent hover:underline focus:outline-none"
          href="mailto:hola@alfon.so"
          aria-label="Enviar email a hola@alfon.so"
        >
          hola@alfon.so
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
    </div>
  );
}

function ProjectsContent({ onOpenLink }: { onOpenLink: (url: string) => void }) {
  const items: ExplorerItem[] = PROJECTS.map((project) => ({
    id: project.title,
    label: project.title,
    kind: 'Proyecto',
    graphic: project.icon,
    title: project.description,
    disabled: !project.link,
  }));

  return (
    <ExplorerLayout
      items={items}
      onActivate={(id) => {
        const project = PROJECTS.find((entry) => entry.title === id);
        if (project?.link) onOpenLink(project.link);
      }}
    />
  );
}

function BlogContent({
  posts,
  onOpenPost,
}: {
  posts: BlogPostSummary[];
  onOpenPost: (slug: string) => void;
}) {
  return (
    <ListLayout>
      {posts.map((post) => (
        <PostListItem
          key={post.slug}
          title={post.title}
          slug={post.slug}
          publishDate={post.publishDate}
          onOpen={() => onOpenPost(post.slug)}
        />
      ))}
    </ListLayout>
  );
}

const PROSE_CLASS =
  'prose prose-base max-w-none prose-zinc dark:prose-invert prose-headings:scroll-mt-20 prose-headings:font-bold prose-headings:text-primary prose-h1:text-2xl prose-h2:mt-8 prose-h2:mb-3 prose-h2:text-xl prose-h3:mt-6 prose-h3:mb-2 prose-h3:text-lg prose-p:leading-relaxed prose-p:text-secondary prose-a:text-primary hover:prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-blockquote:rounded-r prose-blockquote:border-l-zinc-400/60 dark:prose-blockquote:border-l-zinc-500/60 prose-blockquote:bg-black/[0.04] dark:prose-blockquote:bg-white/[0.04] prose-blockquote:px-4 prose-blockquote:py-1 prose-strong:font-semibold prose-strong:text-primary prose-code:rounded prose-code:bg-black/[0.06] dark:prose-code:bg-white/[0.08] prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:text-primary prose-code:before:content-none prose-code:after:content-none prose-pre:border prose-pre:border-gray-300/50 prose-pre:bg-surface prose-pre:text-sm dark:prose-pre:border-gray-700/50 prose-li:text-secondary prose-li:marker:text-muted prose-img:rounded-lg prose-img:shadow-md';

const longDateFormatter = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function PostContent({ post }: { post: BlogPostSummary }) {
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
          <time dateTime={date.toISOString()}>{longDateFormatter.format(date)}</time>
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

      <article className={PROSE_CLASS} dangerouslySetInnerHTML={{ __html: post.html }} />

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

function Redacted({ width }: { width: string }) {
  return (
    <span
      className="mx-0.5 inline-block h-3 translate-y-0.5 rounded-[1px] bg-black/85 align-baseline dark:bg-white/80"
      style={{ width }}
      aria-hidden="true"
    />
  );
}

interface ClassifiedDoc {
  code: string;
  heading: string;
  file: string;
  intro: ReactNode;
  bullets: ReactNode[];
}

const CLASSIFIED_DOCS: Record<string, ClassifiedDoc> = {
  area51: {
    code: 'A-51 / Δ',
    heading: 'INFORME DE INCIDENTE — SECTOR 7',
    file: 'area51.pdf',
    intro: (
      <>
        A las <Redacted width="2.5rem" /> horas, personal del sitio observó un objeto de geometría{' '}
        <Redacted width="4rem" /> sobrevolando el hangar <Redacted width="1.5rem" />. El sujeto
        respondió únicamente al estímulo de <Redacted width="5rem" /> y solicitó una quesadilla.
      </>
    ),
    bullets: [
      <>Muestras recuperadas: 3 cajas de <Redacted width="3.5rem" /> y un control remoto.</>,
      <>Testigos reasignados a la sucursal de <Redacted width="4.5rem" />.</>,
      <>Conclusión: era <Redacted width="6rem" />. Probablemente.</>,
    ],
  },
  ovnis: {
    code: 'OVNI / 99',
    heading: 'CATÁLOGO DE AVISTAMIENTOS NO EXPLICADOS',
    file: 'ovnis.pdf',
    intro: (
      <>
        El presente documento recopila <Redacted width="2rem" /> avistamientos confirmados entre{' '}
        <Redacted width="3rem" /> y el martes pasado. La fuente original fue{' '}
        <Redacted width="5.5rem" /> y no puede divulgarse por motivos de <Redacted width="4rem" />.
      </>
    ),
    bullets: [
      <>Forma predominante: <Redacted width="3rem" /> con luces de color <Redacted width="2.5rem" />.</>,
      <>Velocidad estimada: <Redacted width="4rem" /> nudos (o un Tsuru bien afinado).</>,
      <>Recomendación oficial: no mirar al cielo después de las <Redacted width="2rem" />.</>,
    ],
  },
};

function ClassifiedContent({ doc }: { doc: ClassifiedDoc }) {
  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-gray-400/50 pb-2">
        <span className="font-bold tracking-[0.25em] text-red-600 dark:text-red-400">
          // TOP SECRET //
        </span>
        <span className="text-muted">EXP. {doc.code}</span>
      </div>

      <p className="text-muted">
        NIVEL DE ACCESO: <Redacted width="3.5rem" /> · AUTORIZADO POR <Redacted width="4rem" />
      </p>

      <h2 className="text-sm font-bold tracking-wide text-primary">{doc.heading}</h2>

      <p className="leading-relaxed text-secondary">{doc.intro}</p>

      <ul className="space-y-1.5 text-secondary">
        {doc.bullets.map((bullet, index) => (
          <li key={index} className="flex gap-2">
            <span className="text-muted">▸</span>
            <span className="leading-relaxed">{bullet}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-3 pt-1">
        <span className="inline-block rotate-[-6deg] border-2 border-red-600 px-2 py-0.5 text-[0.6rem] font-bold tracking-[0.2em] text-red-600 dark:border-red-400 dark:text-red-400">
          CLASIFICADO
        </span>
        <span className="text-[0.6rem] text-muted">si lees esto, ya saben dónde vives 👁️</span>
      </div>
    </div>
  );
}

function HappyContent() {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">archivo recuperado... te dijeron que no lo abrieras.</p>
      <div
        className="relative w-full overflow-hidden rounded-md border border-gray-400/40"
        style={{ aspectRatio: '16 / 9' }}
      >
        <iframe
          className="absolute inset-0 h-full w-full"
          src="https://www.youtube.com/embed/I_NkBrDmGxM?si=aOwcN8js3gwgg5vE&controls=0"
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
}

interface TrashJunkItem {
  id: string;
  name: string;
  kind: string;
  icon: string;
  windowId?: string;
  iconKey?: string;
}

/** Permanent papelera contents — folder-style junk drawer. */
const TRASH_JUNK: TrashJunkItem[] = [
  { id: 'area51', name: 'area51.pdf', kind: 'PDF', icon: '📄', windowId: 'area51', iconKey: 'classified' },
  { id: 'ovnis', name: 'ovnis.pdf', kind: 'PDF', icon: '📄', windowId: 'ovnis', iconKey: 'classified' },
  { id: 'happy', name: 'no_abrir.mp4', kind: 'Video', icon: '🎬', windowId: 'happy', iconKey: 'video' },
  { id: 'cv', name: 'mi_cv_final_FINAL_v7.doc', kind: 'Documento', icon: '📄' },
  { id: 'cv-copy', name: 'mi_cv_final_FINAL_v7 (copia).doc', kind: 'Documento', icon: '📄' },
  { id: 'node_modules', name: 'node_modules', kind: 'Carpeta', icon: '📁' },
  { id: 'ideas', name: 'ideas_de_negocio.txt', kind: 'Texto', icon: '📝' },
  { id: 'screenshot', name: 'captura_muy_importante.png', kind: 'Imagen', icon: '🖼️' },
  { id: 'zip', name: 'backup_backup.zip', kind: 'Carpeta comprimida', icon: '🗜️' },
  { id: 'exe', name: 'totally_not_a_virus.exe', kind: 'Aplicación', icon: '⚙️' },
  { id: 'todo', name: 'hacer_algo_productivo.md', kind: 'Markdown', icon: '📝' },
  { id: 'readme', name: 'leer_esto.txt', kind: 'Texto', icon: '📄' },
];

export function getTrashWindowMeta(iconUrls: Record<string, string>) {
  return TRASH_JUNK.filter(
    (entry): entry is TrashJunkItem & { windowId: string; iconKey: string } =>
      Boolean(entry.windowId && entry.iconKey),
  ).map((entry) => ({
    windowId: entry.windowId,
    label: entry.name,
    iconSrc: iconUrls[entry.iconKey] ?? '',
  }));
}

function TrashContent({
  trash,
  iconUrls,
}: {
  trash: TrashController;
  iconUrls: Record<string, string>;
}) {
  const { items, onOpenFile, onRestore, onRestoreAll, onEmpty } = trash;
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  const junkItems: ExplorerItem[] = TRASH_JUNK.map((entry) => ({
    id: entry.id,
    label: entry.name,
    kind: entry.kind,
    graphic: entry.icon,
    iconSrc: entry.iconKey ? iconUrls[entry.iconKey] : undefined,
    disabled: !entry.windowId,
  }));

  const deletedItems: ExplorerItem[] = items.map((item) => ({
    id: item.id,
    label: item.label,
    kind: 'Icono eliminado',
    iconSrc: item.iconSrc,
  }));

  const explorerItems = [...junkItems, ...deletedItems];

  function handleOpen(id: string) {
    const junk = TRASH_JUNK.find((entry) => entry.id === id);
    if (junk?.windowId) {
      onOpenFile(junk.windowId);
      return;
    }
    if (items.some((item) => item.id === id)) {
      onRestore(id);
    }
  }

  return (
    <div className="explorer-panel text-xs">
      <ExplorerLayout items={explorerItems} onActivate={handleOpen} />

      {items.length > 0 && (
        <div className="explorer-actions flex flex-wrap gap-2">
          <button type="button" className="window-action-btn" onClick={onRestoreAll}>
            restaurar todo
          </button>
          <button
            type="button"
            className="window-action-btn window-action-btn--destructive"
            onClick={() => setConfirmEmpty(true)}
          >
            vaciar papelera
          </button>
        </div>
      )}

      {confirmEmpty && (
        <Modal
          title="Vaciar papelera"
          confirmLabel="Vaciar"
          destructive
          onConfirm={onEmpty}
          onClose={() => setConfirmEmpty(false)}
        >
          <p>
            ¿Eliminar permanentemente {items.length} icono{items.length === 1 ? '' : 's'}? Esta acción
            no se puede deshacer.
          </p>
        </Modal>
      )}
    </div>
  );
}

export function createWindowApps(): WindowAppRegistry {
  return {
    [BROWSER_WINDOW_ID]: {
      render: ({ browserUrl, browserReloadKey }) => {
        if (!browserUrl) {
          return (
            <p className="text-xs text-muted">
              escribe una URL en la barra de arriba y presiona enter.
            </p>
          );
        }
        return <BrowserContent url={browserUrl} reloadKey={browserReloadKey} />;
      },
      chrome: (ctx) => ({
        windowClassName: 'desktop-window--browser',
        bodyClassName: 'browser-window__body',
        resolveTitle: () => ctx.browserUrl ?? 'web browser',
        titleContent: (
          <BrowserTitleContent
            url={ctx.browserUrl}
            onReload={ctx.onBrowserReload}
            onNavigate={ctx.onBrowserNavigate}
          />
        ),
      }),
    },
    terminal: {
      render: ({ posts, focusedWindowId }) => (
        <TerminalApp posts={posts} focused={focusedWindowId === 'terminal'} />
      ),
      chrome: {
        windowClassName: 'desktop-window--terminal',
        bodyClassName: 'terminal-window__body',
      },
    },
    about: {
      render: () => <AboutContent />,
    },
    projects: {
      explorer: true,
      render: ({ onOpenLink }) => <ProjectsContent onOpenLink={onOpenLink} />,
    },
    blog: {
      render: ({ posts, onOpenPost }) => <BlogContent posts={posts} onOpenPost={onOpenPost} />,
    },
    area51: {
      render: () => <ClassifiedContent doc={CLASSIFIED_DOCS.area51} />,
    },
    ovnis: {
      render: () => <ClassifiedContent doc={CLASSIFIED_DOCS.ovnis} />,
    },
    happy: {
      render: () => <HappyContent />,
    },
    trash: {
      explorer: true,
      render: ({ trash, iconUrls }) => <TrashContent trash={trash} iconUrls={iconUrls} />,
    },
    settings: {
      render: () => <SettingsContent />,
      chrome: { bodyClassName: 'card-body--settings' },
    },
    'post:*': {
      render: ({ posts }, id) => {
        const slug = id.slice(POST_WINDOW_PREFIX.length);
        const post = posts.find((entry) => entry.slug === slug);
        return post ? <PostContent post={post} /> : null;
      },
    },
  };
}
