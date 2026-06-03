import { useCallback, useEffect, useRef, useState } from 'react';
import type { BlogPostSummary } from '../../types';
import { useTheme } from '../../state/ThemeContext';
import { runTerminalCommand, TERMINAL_MOTD, TERMINAL_PROMPT, type TerminalBlock } from './commands';

interface TerminalAppProps {
  posts: BlogPostSummary[];
  focused?: boolean;
}

function TerminalLine({ line }: { line: string }) {
  return <div className="[word-break:break-word] whitespace-pre-wrap">{line}</div>;
}

function TerminalCommandLine({ command }: { command: string }) {
  return (
    <div className="flex flex-wrap gap-[0.375rem] [word-break:break-word] whitespace-pre-wrap">
      <span className="shrink-0 text-accent">{TERMINAL_PROMPT}</span>
      <span className="min-w-0 flex-1">{command}</span>
    </div>
  );
}

function TerminalBlockView({ block }: { block: TerminalBlock }) {
  if (block.kind === 'command') {
    return <TerminalCommandLine command={block.text} />;
  }

  return (
    <>
      {block.lines.map((line, index) => (
        <TerminalLine key={index} line={line} />
      ))}
    </>
  );
}

export default function TerminalApp({ posts, focused = false }: TerminalAppProps) {
  const { theme } = useTheme();
  const [blocks, setBlocks] = useState<TerminalBlock[]>([]);
  const [draft, setDraft] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

    const result = runTerminalCommand(trimmed, { posts, theme });

    setHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);
    setDraft('');

    if (!result) return;

    if ('clear' in result) {
      setBlocks([]);
    } else {
      setBlocks((prev) => [...prev, ...result.blocks, { kind: 'output', lines: [''] }]);
    }

    focusInput();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (history.length === 0) return;
      const nextIndex = historyIndex < 0 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setDraft(history[nextIndex] ?? '');
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (historyIndex < 0) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= history.length) {
        setHistoryIndex(-1);
        setDraft('');
      } else {
        setHistoryIndex(nextIndex);
        setDraft(history[nextIndex] ?? '');
      }
    }
  }

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#141414] font-[ui-monospace,monospace] text-[0.6875rem] leading-[1.45] text-[#d4d4d8]"
      onPointerDown={focusInput}
      role="region"
      aria-label="Terminal"
    >
      <div
        ref={scrollRef}
        className="min-h-0 flex-[1_1_auto] overflow-x-hidden overflow-y-auto overscroll-contain px-3 pt-3 pb-2"
      >
        <div className="mb-1" aria-hidden="true">
          {TERMINAL_MOTD.map((line, index) => (
            <TerminalLine key={index} line={line} />
          ))}
        </div>

        <div className="min-h-0">
          {blocks.map((block, index) => (
            <TerminalBlockView key={index} block={block} />
          ))}
        </div>
      </div>

      <form
        className="flex shrink-0 items-center gap-[0.375rem] border-t border-t-[rgb(63_63_70/0.6)] bg-[#141414] px-3 py-2"
        onSubmit={(event) => {
          event.preventDefault();
          submitCommand();
        }}
      >
        <label className="shrink-0 text-accent" htmlFor="terminal-input">
          {TERMINAL_PROMPT}
        </label>
        <input
          id="terminal-input"
          ref={inputRef}
          type="text"
          className="min-w-0 flex-1 border-0 bg-transparent p-0 font-[inherit] text-[length:inherit] leading-[inherit] text-[color:inherit] outline-none"
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
  );
}
