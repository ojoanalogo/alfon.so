import { useCallback, useEffect, useRef, useState } from 'react';
import { SOCIAL_LINKS } from '../../../config';
import type { BlogPostSummary } from './types';

const PROMPT = 'guest@alfon.so:~$';

const WELCOME = [
  'alfonso reyes · alfon.so',
  'escribe "help" para ver los comandos disponibles.',
  '',
];

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
  'proyectos': [
    'drwxr-xr-x  sofia/       registra gastos por WhatsApp',
    'drwxr-xr-x  terminus/   plantilla Astro terminal',
    'drwxr-xr-x  hilitos/    marketplaces tipo Etsy',
    'drwxr-xr-x  dotfiles/   config de mi equipo',
    'drwxr-xr-x  wawa/       flujos conversacionales WA',
  ],
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
    '⚠️  te dijeron que NO lo abieras.',
    'hint: está en la Papelera. doble clic si insistes.',
  ],
};

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

function lsLines(): string[] {
  return [
    'Escritorio:',
    '  about.txt    blog.sql    photos.jpg',
    '  proyectos    startup.sh  terminal.sh',
    '',
    'Papelera:',
    '  area51.pdf   ovnis.pdf   no_abrir.mp4',
  ];
}

interface TerminalAppProps {
  posts: BlogPostSummary[];
}

export default function TerminalApp({ posts }: TerminalAppProps) {
  const [lines, setLines] = useState<string[]>(WELCOME);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const blogSqlLines = useCallback(
    () => [
      '-- SELECT title FROM blog ORDER BY publish_date DESC;',
      ...posts.map((post) => `  '${post.title.replace(/'/g, "''")}',`),
      posts.length > 0 ? `-- ${posts.length} row(s)` : '-- (empty)',
    ],
    [posts],
  );

  const runCommand = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;

      setHistory((prev) => [...prev, trimmed]);
      setHistoryIndex(-1);

      const parts = trimmed.split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const arg = parts.slice(1).join(' ');

      let output: string[] = [];

      switch (cmd) {
        case 'help':
          output = helpLines();
          break;
        case 'about':
          output = aboutLines();
          break;
        case 'social':
          output = socialLines();
          break;
        case 'ls':
          output = lsLines();
          break;
        case 'cat': {
          if (!arg) {
            output = ['cat: falta archivo', 'prueba: cat about.txt'];
            break;
          }
          const name = arg.replace(/^~\/Desktop\//, '').replace(/^~\//, '');
          if (name === 'blog.sql') {
            output = blogSqlLines();
            break;
          }
          const content = CAT_FILES[name];
          if (content) {
            output = content;
          } else {
            output = [`cat: ${name}: no such file`, 'usa "ls" para ver archivos disponibles'];
          }
          break;
        }
        case 'neofetch':
        case 'fetch':
          output = neofetchLines();
          break;
        case 'clear':
          setLines([]);
          return;
        case 'whoami':
          output = ['guest'];
          break;
        default:
          output = [`${cmd}: command not found`, 'escribe "help" para ver comandos'];
      }

      setLines((prev) => [...prev, `${PROMPT} ${trimmed}`, ...output, '']);
    },
    [blogSqlLines],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (history.length === 0) return;
      const nextIndex = historyIndex < 0 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInput(history[nextIndex] ?? '');
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (historyIndex < 0) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= history.length) {
        setHistoryIndex(-1);
        setInput('');
      } else {
        setHistoryIndex(nextIndex);
        setInput(history[nextIndex] ?? '');
      }
    }
  }

  return (
    <div
      className="desktop-terminal"
      onPointerDown={() => inputRef.current?.focus()}
      role="region"
      aria-label="Terminal"
    >
      <div className="desktop-terminal__output">
        {lines.map((line, index) => (
          <div key={index} className="desktop-terminal__line">
            {line.startsWith(PROMPT) ? (
              <>
                <span className="desktop-terminal__prompt">{PROMPT}</span>
                {line.slice(PROMPT.length)}
              </>
            ) : (
              line
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form
        className="desktop-terminal__input-row"
        onSubmit={(event) => {
          event.preventDefault();
          runCommand(input);
          setInput('');
        }}
      >
        <span className="desktop-terminal__prompt">{PROMPT}</span>
        <input
          ref={inputRef}
          type="text"
          className="desktop-terminal__input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          aria-label="Comando de terminal"
        />
      </form>
    </div>
  );
}
