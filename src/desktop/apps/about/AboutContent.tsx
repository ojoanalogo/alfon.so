import { Divider, ExternalLink, InfoRow, SocialMediaIcons } from '@desktop/ui/parts';
import { TECH_STACK } from '../projects/data';

const ABOUT_LINK_CLASS = 'text-link hover:underline focus:outline-none';

export default function AboutContent() {
  return (
    <div className="space-y-4 text-xs sm:space-y-2">
      <div className="mb-4 flex items-center gap-3">
        {/* Profile photo placeholder — swap the emoji for an <img> when the photo is ready */}
        <div
          className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-stone-300/70 text-3xl dark:bg-gray-500/10"
          role="img"
          aria-label="Foto de perfil de alfonso reyes"
        >
          🧑‍💻
        </div>
        <div className="flex flex-col gap-1">
          <h1 id="about-heading" className="text-lg">
            👋 ¡hola! soy <span className="font-semibold text-primary">alfonso reyes</span>
          </h1>
          <p className="text-xs text-muted">ingeniero backend · fotógrafo</p>
        </div>
      </div>

      <div className="mb-4 rounded-lg bg-stone-300/70 p-3 dark:bg-gray-500/10">
        <p className="leading-relaxed text-primary">
          bienvenido a mi pequeño rincón en internet, aquí encontrarás mis pensamientos (pocos), mis
          proyectos y mi blog.
        </p>
      </div>

      <Divider className="mb-2" />

      <InfoRow label="ubicación">méxico 🇲🇽</InfoRow>

      <InfoRow label="trabajo">
        ingeniero backend @{' '}
        <ExternalLink
          href="https://monopolio.com.mx"
          label="Visitar sitio web monopolio.com.mx"
          className={ABOUT_LINK_CLASS}
        >
          monopolio.com.mx
        </ExternalLink>
      </InfoRow>

      <InfoRow label="hobby">
        fotografía @{' '}
        <ExternalLink
          href="https://ojoanalogo.com"
          label="Visitar portafolio de fotografía ojoanalogo.com"
          className={ABOUT_LINK_CLASS}
        >
          ojoanalogo.com
        </ExternalLink>
      </InfoRow>

      <InfoRow label="comunidad">
        cursor ambassador @{' '}
        <ExternalLink
          href="https://cursor.com/ambassadors"
          label="Cursor Ambassador Program"
          className={ABOUT_LINK_CLASS}
        >
          cursor.com/ambassadors
        </ExternalLink>
      </InfoRow>

      <InfoRow label="proyecto actual">
        <ExternalLink
          href="https://sofinanzas.mx"
          label="Visitar SofIA - Asistente de finanzas con IA"
          className={ABOUT_LINK_CLASS}
        >
          sofia
        </ExternalLink>{' '}
        - asistente de finanzas personales para todos 💸
      </InfoRow>

      <InfoRow label="intereses">
        programación · startups · ciencia ficción · películas · fotografía
      </InfoRow>

      <InfoRow label="contacto">
        <a
          className={ABOUT_LINK_CLASS}
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
