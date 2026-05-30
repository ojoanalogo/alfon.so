import { Redacted } from './ClassifiedContent';
import type { ClassifiedDoc } from '../data';

/**
 * JSX-rich classified docs. Lives in a .tsx so the `<Redacted />` blocks stay
 * statically authored; the plain-data side of trash junk lives in ../data.ts.
 */
export const CLASSIFIED_DOCS: Record<string, ClassifiedDoc> = {
  area51: {
    code: 'A-51 / Δ',
    heading: 'INFORME DE INCIDENTE — SECTOR 7',
    file: 'area51.pdf',
    intro: (
      <>
        A las <Redacted width="2.5rem" /> horas, personal del sitio observó un objeto de geometría{' '}
        <Redacted width="4rem" /> sobrevolando el hangar <Redacted width="1.5rem" />. El sujeto
        respondió únicamente al estímulo de <Redacted width="5rem" /> y solicitó una quesadilla.
      </>
    ),
    bullets: [
      <>
        Muestras recuperadas: 3 cajas de <Redacted width="3.5rem" /> y un control remoto.
      </>,
      <>
        Testigos reasignados a la sucursal de <Redacted width="4.5rem" />.
      </>,
      <>
        Conclusión: era <Redacted width="6rem" />. Probablemente.
      </>,
    ],
  },
  ovnis: {
    code: 'OVNI / 99',
    heading: 'CATÁLOGO DE AVISTAMIENTOS NO EXPLICADOS',
    file: 'ovnis.pdf',
    intro: (
      <>
        El presente documento recopila <Redacted width="2rem" /> avistamientos confirmados entre{' '}
        <Redacted width="3rem" /> y el martes pasado. La fuente original fue{' '}
        <Redacted width="5.5rem" /> y no puede divulgarse por motivos de <Redacted width="4rem" />.
      </>
    ),
    bullets: [
      <>
        Forma predominante: <Redacted width="3rem" /> con luces de color <Redacted width="2.5rem" />
        .
      </>,
      <>
        Velocidad estimada: <Redacted width="4rem" /> nudos (o un Tsuru bien afinado).
      </>,
      <>
        Recomendación oficial: no mirar al cielo después de las <Redacted width="2rem" />.
      </>,
    ],
  },
};
