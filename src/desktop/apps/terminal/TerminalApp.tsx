import { useCallback, useEffect, useRef, useState } from 'react';
import type { BlogPostSummary } from '../../types';
import { runTerminalCommand, TERMINAL_MOTD, TERMINAL_PROMPT, type TerminalBlock } from './commands';
import { useCommandHistory } from './useCommandHistory';

interface TerminalAppProps {
  posts: BlogPostSummary[];
  focused?: boolean;
  onOpenApp?: (id: string) => void;
  onOpenNote?: (noteId: string, mode?: 'preview' | 'edit') => void;
}

function TerminalLine({ line }: { line: string }) {
  return <div className="[word-break:break-word] whitespace-pre-wrap">{line}</div>;
}

function TerminalCommandLine({ command }: { command: string }) {
  return (
    <div className="flex flex-wrap gap-[0.5rem] [word-break:break-word] whitespace-pre-wrap">
      <span className="shrink-0 text-[#4ade80]">{TERMINAL_PROMPT}</span>
      <span className="min-w-0 flex-1 text-[#e4e4e7]">{command}</span>
    </div>
  );
}

function TerminalBlockView({ block }: { block: TerminalBlock }) {
  if (block.kind === 'command') {
    return <TerminalCommandLine command={block.text} />;
  }

  return (
    <div className="text-[#a1a1aa]">
      {block.lines.map((line, index) => (
        <TerminalLine key={index} line={line} />
      ))}
    </div>
  );
}

export default function TerminalApp({
  posts,
  focused = false,
  onOpenApp,
  onOpenNote,
}: TerminalAppProps) {
  const [blocks, setBlocks] = useState<TerminalBlock[]>([]);
  const [draft, setDraft] = useState('');
  const { push: pushHistory, navigateUp, navigateDown } = useCommandHistory();

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // macOS-style session banner, fixed for the lifetime of the mount.
  const [loginLine] = useState(() => {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    return `Last login: ${now.toDateString()} ${time} on ttys000`;
  });

  const focusInput = useCallback(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (focused) focusInput();
  }, [focused, focusInput]);

  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    scroll.scrollTop = scroll.scrollHeight;
  }, [blocks]);

  function submitCommand() {
    const trimmed = draft.trim();
    if (!trimmed) return;

    const result = runTerminalCommand(trimmed, { posts });

    pushHistory(trimmed);
    setDraft('');

    if (!result) return;

    if ('clear' in result) {
      setBlocks([]);
    } else {
      setBlocks((prev) => [...prev, ...result.blocks, { kind: 'output', lines: [''] }]);
      if (result.action?.type === 'openNote') {
        onOpenNote?.(result.action.noteId, 'edit');
        onOpenApp?.('notes');
      }
    }

    focusInput();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    // Readline shortcuts: ^L clears the scrollback, ^U clears the line.
    if (event.ctrlKey && event.key.toLowerCase() === 'l') {
      event.preventDefault();
      setBlocks([]);
      return;
    }
    if (event.ctrlKey && event.key.toLowerCase() === 'u') {
      event.preventDefault();
      setDraft('');
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const recalled = navigateUp();
      if (recalled !== null) setDraft(recalled);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const recalled = navigateDown();
      if (recalled !== null) setDraft(recalled);
    }
  }

  return (
    <div
      className="flex min-h-0 flex-1 flex-col bg-[#0c0c0e] font-[ui-monospace,SFMono-Regular,Menlo,Monaco,monospace] text-[0.75rem] leading-[1.55] text-[#e4e4e7] selection:bg-[#3f3f46]"
      onPointerDown={focusInput}
      role="region"
      aria-label="Terminal"
    >
      {/* One continuous scrollback: banner, history and the live prompt all
          scroll together, like a real iTerm session. */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-3 py-2.5"
      >
        <div className="mb-1 text-[#5b5b64]" aria-hidden="true">
          <TerminalLine line={loginLine} />
          {TERMINAL_MOTD.map((line, index) => (
            <TerminalLine key={index} line={line} />
          ))}
        </div>

        {blocks.map((block, index) => (
          <TerminalBlockView key={index} block={block} />
        ))}

        <form
          className="flex items-baseline gap-[0.5rem]"
          onSubmit={(event) => {
            event.preventDefault();
            submitCommand();
          }}
        >
          <label className="shrink-0 text-[#4ade80]" htmlFor="terminal-input">
            {TERMINAL_PROMPT}
          </label>
          <input
            id="terminal-input"
            ref={inputRef}
            type="text"
            className="min-w-0 flex-1 border-0 bg-transparent p-0 font-[inherit] text-[length:inherit] leading-[inherit] text-[#e4e4e7] caret-[#4ade80] outline-none"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            aria-label="Comando de terminal"
          />
        </form>
      </div>
    </div>
  );
}
