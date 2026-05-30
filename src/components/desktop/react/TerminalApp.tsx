import { useCallback, useEffect, useRef, useState } from 'react';
import type { BlogPostSummary } from './types';
import {
  runTerminalCommand,
  TERMINAL_MOTD,
  TERMINAL_PROMPT,
  type TerminalBlock,
} from './terminal/commands';

interface TerminalAppProps {
  posts: BlogPostSummary[];
  focused?: boolean;
}

function TerminalLine({ line }: { line: string }) {
  return <div className="terminal__line">{line}</div>;
}

function TerminalCommandLine({ command }: { command: string }) {
  return (
    <div className="terminal__line terminal__line--command">
      <span className="terminal__prompt">{TERMINAL_PROMPT}</span>
      <span className="terminal__command">{command}</span>
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

    const result = runTerminalCommand(trimmed, { posts });

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
    <div className="terminal" onPointerDown={focusInput} role="region" aria-label="Terminal">
      <div ref={scrollRef} className="terminal__scroll">
        <div className="terminal__motd" aria-hidden="true">
          {TERMINAL_MOTD.map((line, index) => (
            <TerminalLine key={index} line={line} />
          ))}
        </div>

        <div className="terminal__history">
          {blocks.map((block, index) => (
            <TerminalBlockView key={index} block={block} />
          ))}
        </div>
      </div>

      <form
        className="terminal__composer"
        onSubmit={(event) => {
          event.preventDefault();
          submitCommand();
        }}
      >
        <label className="terminal__prompt" htmlFor="terminal-input">
          {TERMINAL_PROMPT}
        </label>
        <input
          id="terminal-input"
          ref={inputRef}
          type="text"
          className="terminal__input"
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
