import { SOCIAL_LINKS } from '@/config';
import type { BlogPostSummary } from '../../types';
import { APPS } from '../registry';
import { PROJECTS } from '../projects/data';
import { TRASH_JUNK } from '../trash/junk';

export const TERMINAL_PROMPT = 'guest@alfon.so:~$';

export const TERMINAL_MOTD = ['escribe "help" para ver los comandos disponibles.', ''];

const CAT_FILES: Record<string, string[]> = {
  'about.txt': [
    '👋 hola soy alfonso reyes',
    'ingeniero backend / fotógrafo · méxico 🌮',
    '',
    'bienvenido a mi pequeño rincón en internet.',
    'trabajo: monopolio.com.mx · hobby: ojoanalogo.com',
    'contacto: hola@alfon.so',
  ],
  'blog.sql': ['-- SELECT title FROM blog ORDER BY publish_date DESC;'],
  'photos.jpg': [
    'photos.jpg → https://ojoanalogo.com',
    '(abre desde el icono del escritorio o el menú inicio)',
  ],
  'startup.sh': [
    '#!/bin/bash',
    'echo "molecula.digital — productos digitales"',
    '# abre https://molecula.digital',
  ],
  proyectos: PROJECTS.map(
    (project) => `drwxr-xr-x  ${`${project.title}/`.padEnd(12)}${project.description}`,
  ),
  'area51.pdf': [
    '*** TOP SECRET — area51.pdf ***',
    '',
    'INFORME DE INCIDENTE — SECTOR 7',
    'A las [REDACTED] horas se observó un objeto [REDACTED]',
    'sobre el hangar [REDACTED]. Solicitó una quesadilla.',
    '',
    'Conclusión: era [REDACTED]. Probablemente.',
    'si lees esto, ya saben dónde vives 👁️',
  ],
  'ovnis.pdf': [
    '*** CLASIFICADO — ovnis.pdf ***',
    '',
    'CATÁLOGO DE AVISTAMIENTOS NO EXPLICADOS',
    '[REDACTED] avistamientos entre [REDACTED] y el martes pasado.',
    'Forma: [REDACTED] · Velocidad: [REDACTED] nudos',
    'Recomendación: no mirar al cielo después de las [REDACTED].',
  ],
  'no_abrir.mp4': [
    'no_abrir.mp4 — archivo multimedia',
    '⚠️  te dijeron que NO lo abrieras.',
    'hint: está en la Papelera. doble clic si insistes.',
  ],
};

export type TerminalBlock = { kind: 'command'; text: string } | { kind: 'output'; lines: string[] };

export type TerminalCommandResult = { blocks: TerminalBlock[] } | { clear: true } | null;

export interface TerminalCommandContext {
  posts: BlogPostSummary[];
}

function neofetchLines(): string[] {
  const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  return [
    '        ▄▄▄▄▄▄▄        guest@alfon.so',
    '      ▄████████▄      ─────────────────',
    '      ██████████      OS: alfon.so (devfolio)',
    '      ████▀▀████      Host: Astro + React Island',
    '       ▀▀████▀▀       Kernel: fake-sh 1.0',
    '     ▄█████████▄      Uptime: since pageload',
    '   ▄█████████████▄    Shell: terminal.sh',
    '  ████▀       ▀████   Theme: ' + theme,
    '                      CPU: 100% café ☕',
    '                      Memory: ∞ curiosidad',
    '                      WM: draggable-windows',
  ];
}

function helpLines(): string[] {
  return [
    'Comandos disponibles:',
    '  about        info del sitio',
    '  social       enlaces a redes',
    '  ls           archivos del escritorio (+ papelera)',
    '  cat FILE     leer un archivo',
    '  neofetch     info del sistema',
    '  fetch        alias de neofetch',
    '  clear        limpiar pantalla',
    '  help         esta ayuda',
  ];
}

function aboutLines(): string[] {
  return [
    'alfon.so — portafolio personal',
    'ingeniero backend @ monopolio.com.mx',
    'fotógrafo @ ojoanalogo.com',
    'cursor ambassador · méxico 🌮',
    '',
    'proyecto actual: sofia (sofinanzas.mx) 💸',
    'email: hola@alfon.so',
  ];
}

function socialLines(): string[] {
  return SOCIAL_LINKS.map((link) => `${link.platform.padEnd(10)} ${link.url}`);
}

function chunkRows(items: string[], perRow: number): string[] {
  const rows: string[] = [];
  for (let i = 0; i < items.length; i += perRow) {
    rows.push('  ' + items.slice(i, i + perRow).join('   '));
  }
  return rows;
}

/** Desktop filenames derived from the registry, so `ls` can't go stale. */
function desktopFileNames(): string[] {
  return APPS.filter((app) => app.desktopIcon !== false).map((app) => {
    const cfg = typeof app.desktopIcon === 'object' && app.desktopIcon ? app.desktopIcon : {};
    return cfg.label ?? (typeof app.title === 'string' ? app.title : app.id);
  });
}

function lsLines(): string[] {
  return [
    'Escritorio:',
    ...chunkRows(desktopFileNames(), 3),
    '',
    'Papelera:',
    ...chunkRows(
      TRASH_JUNK.map((entry) => entry.name),
      3,
    ),
  ];
}

function blogSqlLines(posts: BlogPostSummary[]): string[] {
  return [
    '-- SELECT title FROM blog ORDER BY publish_date DESC;',
    ...posts.map((post) => `  '${post.title.replace(/'/g, "''")}',`),
    posts.length > 0 ? `-- ${posts.length} row(s)` : '-- (empty)',
  ];
}

export function runTerminalCommand(
  raw: string,
  ctx: TerminalCommandContext,
): TerminalCommandResult {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const arg = parts.slice(1).join(' ');

  const commandBlock: TerminalBlock = { kind: 'command', text: trimmed };

  switch (cmd) {
    case 'help':
      return { blocks: [commandBlock, { kind: 'output', lines: helpLines() }] };
    case 'about':
      return { blocks: [commandBlock, { kind: 'output', lines: aboutLines() }] };
    case 'social':
      return { blocks: [commandBlock, { kind: 'output', lines: socialLines() }] };
    case 'ls':
      return { blocks: [commandBlock, { kind: 'output', lines: lsLines() }] };
    case 'cat': {
      if (!arg) {
        return {
          blocks: [
            commandBlock,
            { kind: 'output', lines: ['cat: falta archivo', 'prueba: cat about.txt'] },
          ],
        };
      }
      const name = arg.replace(/^~\/Desktop\//, '').replace(/^~\//, '');
      if (name === 'blog.sql') {
        return {
          blocks: [commandBlock, { kind: 'output', lines: blogSqlLines(ctx.posts) }],
        };
      }
      const content = CAT_FILES[name];
      if (content) {
        return { blocks: [commandBlock, { kind: 'output', lines: content }] };
      }
      return {
        blocks: [
          commandBlock,
          {
            kind: 'output',
            lines: [`cat: ${name}: no such file`, 'usa "ls" para ver archivos disponibles'],
          },
        ],
      };
    }
    case 'neofetch':
    case 'fetch':
      return { blocks: [commandBlock, { kind: 'output', lines: neofetchLines() }] };
    case 'clear':
      return { clear: true };
    case 'whoami':
      return { blocks: [commandBlock, { kind: 'output', lines: ['guest'] }] };
    default:
      return {
        blocks: [
          commandBlock,
          {
            kind: 'output',
            lines: [`${cmd}: command not found`, 'escribe "help" para ver comandos'],
          },
        ],
      };
  }
}
