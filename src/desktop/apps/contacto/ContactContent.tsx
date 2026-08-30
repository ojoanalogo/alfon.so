import { useState } from 'react';
import { EnvelopeSimpleIcon, PaperPlaneTiltIcon } from '@phosphor-icons/react';
import { SITE } from '@desktop/lib/siteContent';
import { WINDOW_ACTION_BTN } from '@/styles/tokens';

const TO_ADDRESS = SITE.person.email;

const FIELD_ROW =
  'flex items-center gap-2 border-b border-gray-300/50 px-3 py-2 dark:border-gray-700/50';
const FIELD_LABEL = 'w-12 shrink-0 text-[0.6875rem] text-muted';
const FIELD_INPUT =
  'min-w-0 flex-1 border-0 bg-transparent py-0 text-sm text-primary outline-none placeholder:text-muted';

export default function ContactContent() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  function handleSend(event: SubmitEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (subject.trim()) params.set('subject', subject.trim());
    if (body.trim()) params.set('body', body.trim());
    const query = params.toString();
    window.location.href = `mailto:${TO_ADDRESS}${query ? `?${query}` : ''}`;
  }

  return (
    <form
      className="mail-compose flex min-h-0 min-w-0 flex-1 flex-col text-xs"
      onSubmit={(event) => handleSend(event.nativeEvent)}
    >
      <header
        className="mail-compose__ribbon flex shrink-0 items-center gap-2.5 border-b border-[rgb(113_113_122/0.3)] bg-[linear-gradient(180deg,rgb(113_113_122/0.16)_0%,rgb(113_113_122/0.06)_100%)] px-3 py-2 dark:bg-[linear-gradient(180deg,rgb(161_161_170/0.12)_0%,rgb(24_24_27/0.4)_100%)]"
        role="toolbar"
        aria-label="Correo"
      >
        <span
          className="flex size-8 shrink-0 items-center justify-center border border-[color:var(--color-hairline)] bg-[var(--color-control-fill-strong)]"
          aria-hidden
        >
          <EnvelopeSimpleIcon size={16} className="text-zinc-700 dark:text-zinc-400" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[0.8125rem] font-medium text-primary">Nuevo mensaje</span>
          <span className="truncate text-[0.625rem] text-muted">
            abre el borrador en tu app de correo
          </span>
        </div>
        <button type="submit" className={`${WINDOW_ACTION_BTN} inline-flex items-center gap-1.5`}>
          <PaperPlaneTiltIcon size={12} aria-hidden />
          Enviar
        </button>
      </header>

      <label className={FIELD_ROW}>
        <span className={FIELD_LABEL}>Para</span>
        <span className="min-w-0 flex-1 truncate text-sm text-primary">{TO_ADDRESS}</span>
      </label>

      <label className={FIELD_ROW}>
        <span className={FIELD_LABEL}>Asunto</span>
        <input
          type="text"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          className={FIELD_INPUT}
          placeholder="hola desde alfon.so"
          autoComplete="off"
        />
      </label>

      <label className="flex min-h-0 flex-1 flex-col">
        <span className="sr-only">Mensaje</span>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className="min-h-0 flex-1 resize-none bg-transparent px-3 py-2 text-sm leading-relaxed text-secondary outline-none placeholder:text-muted"
          placeholder="escribe tu mensaje…"
        />
      </label>
    </form>
  );
}
