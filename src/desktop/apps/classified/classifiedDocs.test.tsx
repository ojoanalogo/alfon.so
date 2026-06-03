import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { isValidElement } from 'react';
import { CLASSIFIED_DOCS } from './classifiedDocs';
import ClassifiedContent from './ClassifiedContent';

const DOC_KEYS = Object.keys(CLASSIFIED_DOCS) as Array<keyof typeof CLASSIFIED_DOCS>;

describe('CLASSIFIED_DOCS data structure', () => {
  it('exports the expected document keys', () => {
    expect(DOC_KEYS.sort()).toEqual(['area51', 'ovnis']);
  });

  it.each(DOC_KEYS)('doc "%s" has non-empty string code, heading, and file', (key) => {
    const doc = CLASSIFIED_DOCS[key];
    expect(typeof doc.code).toBe('string');
    expect(doc.code.length).toBeGreaterThan(0);
    expect(typeof doc.heading).toBe('string');
    expect(doc.heading.length).toBeGreaterThan(0);
    expect(typeof doc.file).toBe('string');
    expect(doc.file.length).toBeGreaterThan(0);
  });

  it.each(DOC_KEYS)('doc "%s" file ends in .pdf', (key) => {
    expect(CLASSIFIED_DOCS[key].file.endsWith('.pdf')).toBe(true);
  });

  it.each(DOC_KEYS)('doc "%s" intro is a renderable React node', (key) => {
    expect(isValidElement(CLASSIFIED_DOCS[key].intro)).toBe(true);
  });

  it.each(DOC_KEYS)('doc "%s" bullets is a non-empty array of React nodes', (key) => {
    const { bullets } = CLASSIFIED_DOCS[key];
    expect(Array.isArray(bullets)).toBe(true);
    expect(bullets.length).toBeGreaterThan(0);
    for (const bullet of bullets) {
      expect(isValidElement(bullet)).toBe(true);
    }
  });

  it('file names are unique across docs', () => {
    const files = DOC_KEYS.map((k) => CLASSIFIED_DOCS[k].file);
    expect(new Set(files).size).toBe(files.length);
  });

  it('codes are unique across docs', () => {
    const codes = DOC_KEYS.map((k) => CLASSIFIED_DOCS[k].code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe('CLASSIFIED_DOCS rendered content', () => {
  it('renders the area51 intro text (visible, non-redacted portions)', () => {
    const { container } = render(<>{CLASSIFIED_DOCS.area51.intro}</>);
    expect(container.textContent).toContain('personal del sitio observó un objeto');
    expect(container.textContent).toContain('solicitó una quesadilla');
  });

  it('renders the ovnis intro text', () => {
    const { container } = render(<>{CLASSIFIED_DOCS.ovnis.intro}</>);
    expect(container.textContent).toContain('avistamientos confirmados');
    expect(container.textContent).toContain('el martes pasado');
  });

  it('renders area51 bullets text', () => {
    const { container } = render(<>{CLASSIFIED_DOCS.area51.bullets}</>);
    expect(container.textContent).toContain('Muestras recuperadas');
    expect(container.textContent).toContain('Testigos reasignados');
    expect(container.textContent).toContain('Probablemente');
  });

  it('intro nodes contain Redacted placeholder spans (aria-hidden)', () => {
    const { container } = render(<>{CLASSIFIED_DOCS.area51.intro}</>);
    const redactedSpans = container.querySelectorAll('span[aria-hidden="true"]');
    expect(redactedSpans.length).toBeGreaterThan(0);
  });
});

describe('ClassifiedContent component', () => {
  it('renders a doc heading and code', () => {
    const doc = CLASSIFIED_DOCS.area51;
    render(<ClassifiedContent doc={doc} />);
    expect(screen.getByText(doc.heading)).toBeTruthy();
    expect(screen.getByText(`EXP. ${doc.code}`)).toBeTruthy();
  });

  it('renders the TOP SECRET banner and CLASIFICADO stamp', () => {
    render(<ClassifiedContent doc={CLASSIFIED_DOCS.ovnis} />);
    expect(screen.getByText('// TOP SECRET //')).toBeTruthy();
    expect(screen.getByText('CLASIFICADO')).toBeTruthy();
  });

  it('renders one list item per bullet', () => {
    const doc = CLASSIFIED_DOCS.ovnis;
    const { container } = render(<ClassifiedContent doc={doc} />);
    const items = container.querySelectorAll('li');
    expect(items.length).toBe(doc.bullets.length);
  });

  it('renders the intro text of the provided doc', () => {
    const { container } = render(<ClassifiedContent doc={CLASSIFIED_DOCS.ovnis} />);
    expect(container.textContent).toContain('El presente documento recopila');
  });
});
