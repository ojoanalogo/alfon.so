import type { ClassifiedDoc } from '../data';

function Redacted({ width }: { width: string }) {
  return (
    <span
      className="mx-0.5 inline-block h-3 translate-y-0.5 rounded-[1px] bg-black/85 align-baseline dark:bg-white/80"
      style={{ width }}
      aria-hidden="true"
    />
  );
}

export { Redacted };

export default function ClassifiedContent({ doc }: { doc: ClassifiedDoc }) {
  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-gray-400/50 pb-2">
        <span className="font-bold tracking-[0.25em] text-red-600 dark:text-red-400">
          {'// TOP SECRET //'}
        </span>
        <span className="text-muted">EXP. {doc.code}</span>
      </div>

      <p className="text-muted">
        NIVEL DE ACCESO: <Redacted width="3.5rem" /> · AUTORIZADO POR <Redacted width="4rem" />
      </p>

      <h2 className="text-sm font-bold tracking-wide text-primary">{doc.heading}</h2>

      <p className="leading-relaxed text-secondary">{doc.intro}</p>

      <ul className="space-y-1.5 text-secondary">
        {doc.bullets.map((bullet, index) => (
          <li key={index} className="flex gap-2">
            <span className="text-muted">▸</span>
            <span className="leading-relaxed">{bullet}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-3 pt-1">
        <span className="inline-block rotate-[-6deg] border-2 border-red-600 px-2 py-0.5 text-[0.6rem] font-bold tracking-[0.2em] text-red-600 dark:border-red-400 dark:text-red-400">
          CLASIFICADO
        </span>
        <span className="text-[0.6rem] text-muted">si lees esto, ya saben dónde vives 👁️</span>
      </div>
    </div>
  );
}
