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
    label: 'ambassador',
    path: 'x.ai',
    url: 'https://x.ai',
  },
  currentProject: {
    name: 'sofia',
    host: 'sofinanzas.mx',
    url: 'https://sofinanzas.mx',
    description: 'asistente de finanzas personales para todos',
  },
  welcome: {
    terminal: 'bienvenido a mi pequeño rincón en internet.',
    aboutCard:
      'bienvenido a mi pequeño rincón en internet, aquí encontrarás mis pensamientos (pocos), mis proyectos y mi blog.',
  },
  interests: 'programación · startups · ciencia ficción · películas · fotografía',
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
    `spacex ai ${SITE.community.label} · ${SITE.person.country} ${SITE.person.countryEmoji}`,
    '',
    `proyecto actual: ${SITE.currentProject.name} (${SITE.currentProject.host})`,
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
