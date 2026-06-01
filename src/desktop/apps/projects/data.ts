export interface ProjectEntry {
  title: string;
  description: string;
  link: string;
  icon: string;
}

export const PROJECTS: ProjectEntry[] = [
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

export const TECH_STACK: Record<string, string> = {
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
