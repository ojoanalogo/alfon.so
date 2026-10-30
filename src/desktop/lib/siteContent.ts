/**
 * Canonical site facts and terminal-facing text derived from them.
 * About UI, contact, and terminal commands should pull from here — not duplicate strings.
 */

export const SITE = {
  name: 'alfon.so',
  tagline: 'portafolio personal',
  person: {
    displayName: 'alfonso reyes',
    role: 'ingeniero backend',
    photographer: 'fotógrafo',
    roleLine: 'ingeniero backend / fotógrafo',
    country: 'méxico',
    countryEmoji: '🌮',
    email: 'hola@alfon.so',
  },
  work: {
    host: 'monopolio.com.mx',
    url: 'https://monopolio.com.mx',
  },
  hobby: {
    host: 'ojoanalogo.com',
    url: 'https://ojoanalogo.com',
  },
  community: {
    name: 'tech atlas',
    host: 'atlas-sinaloa.tech',
    url: 'https://atlas-sinaloa.tech',
  },
  ambassador: {
    label: 'spacex ai ambassador',
    path: 'x.ai',
    url: 'https://x.ai',
  },
  projects: [
    { host: 'sofinanzas.mx', url: 'https://sofinanzas.mx' },
    { host: 'jippy.app', url: 'https://jippy.app' },
    { host: 'molecula.digital', url: 'https://molecula.digital' },
    { host: 'drims.dev', url: 'https://drims.dev' },
  ],
  welcome: {
    terminal: 'bienvenido a mi pequeño rincón en internet.',
    aboutCard:
      'construyo productos digitales, impulso la comunidad tech de sinaloa y tomo fotos cuando el trabajo me deja. aquí encontrarás mis proyectos, mi blog y uno que otro pensamiento.',
  },
  interests: 'programación · startups · comunidad · ciencia ficción · películas · fotografía',
  photos: {
    url: 'https://ojoanalogo.com',
  },
  startup: {
    name: 'molecula.digital',
    tagline: 'productos digitales',
    url: 'https://molecula.digital',
  },
} as const;

/** `about` terminal command output. */
export function terminalAboutCommandLines(): string[] {
  return [
    `${SITE.name} — ${SITE.tagline}`,
    `${SITE.person.role} @ ${SITE.work.host}`,
    `${SITE.person.photographer} @ ${SITE.hobby.host}`,
    `comunidad: ${SITE.community.name} (${SITE.community.host})`,
    `${SITE.ambassador.label} · ${SITE.person.country} ${SITE.person.countryEmoji}`,
    '',
    `proyectos: ${SITE.projects.map((p) => p.host).join(' · ')}`,
    `email: ${SITE.person.email}`,
  ];
}

/** `cat about` desktop file preview. */
export function terminalCatAboutLines(): string[] {
  return [
    `👋 hola soy ${SITE.person.displayName}`,
    `${SITE.person.roleLine} · ${SITE.person.country} ${SITE.person.countryEmoji}`,
    '',
    SITE.welcome.terminal,
    `trabajo: ${SITE.work.host} · hobby: ${SITE.hobby.host}`,
    `contacto: ${SITE.person.email}`,
  ];
}

export function terminalCatPhotosLines(): string[] {
  return [
    `photos.jpg → ${SITE.photos.url}`,
    '(abre desde el icono del escritorio o el menú inicio)',
  ];
}

export function terminalCatStartupLines(): string[] {
  return [
    '#!/bin/bash',
    `echo "${SITE.startup.name} — ${SITE.startup.tagline}"`,
    `# abre ${SITE.startup.url}`,
  ];
}

export function siteMailFromLine(): string {
  return `${SITE.person.displayName} <${SITE.person.email}>`;
}
