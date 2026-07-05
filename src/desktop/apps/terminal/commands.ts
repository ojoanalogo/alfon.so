import { SOCIAL_LINKS } from '@/config';
import type { ThemeMode } from '@/lib/theme';
import type { BlogPostSummary } from '../../types';
import {
  terminalAboutCommandLines,
  terminalCatAboutLines,
  terminalCatPhotosLines,
  terminalCatStartupLines,
} from '@desktop/lib/siteContent';
import { desktopAppLabel, desktopAppLabels, desktopVisibleApps } from '../appIcons';
import { findNoteByFileName, noteFileNames } from '../notes/paths';
import { loadNotes } from '../notes/storage';
import { APPS, type AppId } from '../registry';
import { PROJECTS } from '../projects/data';
import { TRASH_JUNK } from '@desktop/lib/trashJunk';

export const TERMINAL_PROMPT = 'guest@alfon.so:~$';

export const TERMINAL_MOTD = ['escribe "help" para ver los comandos disponibles.', ''];

const CAT_BY_APP_ID: Partial<Record<AppId, string[]>> = {
  about: terminalCatAboutLines(),
  photos: terminalCatPhotosLines(),
  startup: terminalCatStartupLines(),
  projects: PROJECTS.map(
    (project) => `drwxr-xr-x  ${`${project.title}/`.padEnd(12)}${project.description}`,
  ),
  contacto: ['correo: hola@alfon.so', '(abre el icono contacto en el escritorio)'],
  cv: ['mi_cv_final_FINAL_v7.doc — currículum', '(abre el icono cv en el escritorio)'],
  settings: ['ajustes del escritorio — tema, fondo, etc.', '(abre settings desde el escritorio)'],
  games: [
    'juegos/ — snake, pong, breakout, plane, minesweeper',
    '(abre el folder juegos/ en el escritorio)',
  ],
  notes: ['notas locales — ~/notes/', '(abre la app Notas o cat un archivo .md)'],
  terminal: ['terminal.sh — estás aquí 🙂', 'escribe "help" para ver comandos'],
};

const TRASH_CAT_CONTENT: Record<string, string[]> = {
  'no_abrir.mp4': [
    'no_abrir.mp4 — archivo multimedia',
    '⚠️  te dijeron que NO lo abrieras.',
    'hint: está en la Papelera. doble clic si insistes.',
  ],
};

export type TerminalBlock = { kind: 'command'; text: string } | { kind: 'output'; lines: string[] };

export type TerminalCommandAction = { type: 'openNote'; noteId: string };

export type TerminalCommandResult =
  | { blocks: TerminalBlock[]; action?: TerminalCommandAction }
  | { clear: true }
  | null;

export interface TerminalCommandContext {
  posts: BlogPostSummary[];
  theme: ThemeMode;
}

function neofetchLines(theme: ThemeMode): string[] {
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
    '  whoami       usuario actual',
    '  clear        limpiar pantalla',
    '  help         esta ayuda',
  ];
}

function aboutLines(): string[] {
  return terminalAboutCommandLines();
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

function findDesktopAppByLabel(label: string, ctx: TerminalCommandContext) {
  return desktopVisibleApps(APPS, { posts: ctx.posts }).find(
    (app) => desktopAppLabel(app) === label,
  );
}

function notesLines(): string[] {
  const files = noteFileNames(loadNotes());
  if (files.length === 0) {
    return ['~/notes:', '  (vacío — crea notas en la app Notas)'];
  }
  return ['~/notes:', ...chunkRows(files, 3)];
}

function lsLines(ctx: TerminalCommandContext): string[] {
  return [
    'Escritorio:',
    ...chunkRows(desktopAppLabels(APPS, { posts: ctx.posts }), 3),
    '',
    ...notesLines(),
    '',
    'Papelera:',
    ...chunkRows(
      TRASH_JUNK.map((entry) => entry.name),
      3,
    ),
  ];
}

function notePreviewLines(content: string): string[] {
  const lines = content.split('\n');
  const preview = lines.slice(0, 12);
  if (lines.length > 12) preview.push('...');
  return preview;
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
      return { blocks: [commandBlock, { kind: 'output', lines: lsLines(ctx) }] };
    case 'cat': {
      if (!arg) {
        return {
          blocks: [
            commandBlock,
            { kind: 'output', lines: ['cat: falta archivo', 'prueba: cat about'] },
          ],
        };
      }
      const name = arg.replace(/^~\/Desktop\//, '').replace(/^~\//, '');
      const desktopApp = findDesktopAppByLabel(name, ctx);
      if (desktopApp) {
        const lines =
          desktopApp.id === 'blog'
            ? blogSqlLines(ctx.posts)
            : CAT_BY_APP_ID[desktopApp.id as AppId];
        if (lines) {
          return { blocks: [commandBlock, { kind: 'output', lines }] };
        }
      }
      const trashContent = TRASH_CAT_CONTENT[name];
      if (trashContent) {
        return { blocks: [commandBlock, { kind: 'output', lines: trashContent }] };
      }
      const notes = loadNotes();
      const note = findNoteByFileName(notes, name);
      if (note) {
        return {
          blocks: [
            commandBlock,
            {
              kind: 'output',
              lines: [
                `# ${note.title}`,
                ...notePreviewLines(note.content),
                '',
                '→ abriendo en Notas…',
              ],
            },
          ],
          action: { type: 'openNote', noteId: note.id },
        };
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
      return { blocks: [commandBlock, { kind: 'output', lines: neofetchLines(ctx.theme) }] };
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
