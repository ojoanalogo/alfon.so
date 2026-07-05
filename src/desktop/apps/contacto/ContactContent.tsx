import { useState } from 'react';
import { SITE, siteMailFromLine } from '@desktop/lib/siteContent';
import { WINDOW_ACTION_BTN } from '@/styles/tokens';

const TO_ADDRESS = SITE.person.email;

type Tab = 'inbox' | 'compose';

const INBOX = [
  {
    id: 'welcome',
    from: siteMailFromLine(),
    subject: 'bienvenido a alfon.so',
    preview: 'gracias por pasar — escríbeme si quieres charlar de backend, fotos o proyectos.',
    body: [
      'hola,',
      '',
      'gracias por visitar mi portafolio. si llegaste hasta aquí, probablemente',
      'tienes buen gusto (o mucho tiempo libre).',
      '',
      'escríbeme si quieres hablar de ingeniería backend, whatsapp bots, astro,',
      'o si solo quieres recomendarme un buen taco en sinaloa.',
      '',
      '— alfonso',
    ],
  },
];

export default function ContactContent() {
  const [tab, setTab] = useState<Tab>('inbox');
  const [selectedId, setSelectedId] = useState(INBOX[0].id);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sent, setSent] = useState(false);

  const selected = INBOX.find((message) => message.id === selectedId) ?? INBOX[0];

  function handleSend(event: SubmitEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (subject.trim()) params.set('subject', subject.trim());
    if (body.trim()) params.set('body', body.trim());
    const query = params.toString();
    window.location.href = `mailto:${TO_ADDRESS}${query ? `?${query}` : ''}`;
    setSent(true);
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col text-xs">
      <div className="flex shrink-0 gap-1 border-b border-gray-300/50 px-2 py-1.5 dark:border-gray-700/50">
        <button
          type="button"
          className={`rounded px-2 py-1 ${tab === 'inbox' ? 'bg-stone-300/70 font-medium dark:bg-gray-500/20' : 'text-muted'}`}
          onClick={() => setTab('inbox')}
        >
          bandeja
        </button>
        <button
          type="button"
          className={`rounded px-2 py-1 ${tab === 'compose' ? 'bg-stone-300/70 font-medium dark:bg-gray-500/20' : 'text-muted'}`}
          onClick={() => {
            setTab('compose');
            setSent(false);
          }}
        >
          redactar
        </button>
      </div>

      {tab === 'inbox' ? (
        <div className="flex min-h-0 flex-1">
          <ul className="w-44 shrink-0 overflow-y-auto border-r border-gray-300/50 dark:border-gray-700/50">
            {INBOX.map((message) => (
              <li key={message.id}>
                <button
                  type="button"
                  className={`w-full px-2 py-2 text-left ${selectedId === message.id ? 'bg-stone-300/50 dark:bg-gray-500/15' : ''}`}
                  onClick={() => setSelectedId(message.id)}
                >
                  <div className="truncate font-medium text-primary">{message.subject}</div>
                  <div className="truncate text-[0.625rem] text-muted">{message.preview}</div>
                </button>
              </li>
            ))}
          </ul>
          <div className="min-w-0 flex-1 overflow-y-auto p-3">
            <div className="mb-3 space-y-1 text-[0.625rem] text-muted">
              <div>
                <span className="text-primary">de:</span> {selected.from}
              </div>
              <div>
                <span className="text-primary">asunto:</span> {selected.subject}
              </div>
            </div>
            <div className="space-y-1 leading-relaxed whitespace-pre-wrap text-primary">
              {selected.body.map((line, index) => (
                <div key={index}>{line || '\u00a0'}</div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <form
          className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3"
          onSubmit={(event) => handleSend(event.nativeEvent)}
        >
          <label className="flex flex-col gap-1">
            <span className="text-[0.625rem] text-muted">para</span>
            <input
              type="text"
              readOnly
              value={TO_ADDRESS}
              className="rounded border border-gray-300/60 bg-stone-200/40 px-2 py-1.5 text-primary dark:border-gray-700/60 dark:bg-gray-500/10"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[0.625rem] text-muted">asunto</span>
            <input
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="rounded border border-gray-300/60 bg-transparent px-2 py-1.5 text-primary outline-none focus:border-accent dark:border-gray-700/60"
              placeholder="hola desde alfon.so"
            />
          </label>
          <label className="flex min-h-0 flex-1 flex-col gap-1">
            <span className="text-[0.625rem] text-muted">mensaje</span>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className="min-h-32 flex-1 resize-none rounded border border-gray-300/60 bg-transparent px-2 py-1.5 text-primary outline-none focus:border-accent dark:border-gray-700/60"
              placeholder="cuéntame en qué puedo ayudarte…"
            />
          </label>
          <div className="flex items-center gap-3">
            <button type="submit" className={WINDOW_ACTION_BTN}>
              enviar
            </button>
            {sent && (
              <span className="text-[0.625rem] text-muted">abriendo tu cliente de correo…</span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
