import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ClassifiedContent, { Redacted } from './ClassifiedContent';
import { CLASSIFIED_DOCS, type ClassifiedDoc } from './classifiedDocs';

describe('Redacted', () => {
  it('renders an aria-hidden bar with the given width', () => {
    const { container } = render(<Redacted width="3rem" />);
    const bar = container.querySelector('span');
    expect(bar).not.toBeNull();
    expect(bar?.getAttribute('aria-hidden')).toBe('true');
    expect(bar?.style.width).toBe('3rem');
  });
});

describe('ClassifiedContent', () => {
  const doc: ClassifiedDoc = {
    code: 'X-42 / Ω',
    heading: 'INFORME DE PRUEBA',
    file: 'test.pdf',
    intro: 'una introducción de prueba',
    bullets: ['primer punto', 'segundo punto', 'tercer punto'],
  };

  it('renders the top secret banner and the doc code', () => {
    render(<ClassifiedContent doc={doc} />);
    expect(screen.getByText('// TOP SECRET //')).toBeTruthy();
    expect(screen.getByText(`EXP. ${doc.code}`)).toBeTruthy();
  });

  it('renders the heading and intro from the doc prop', () => {
    render(<ClassifiedContent doc={doc} />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading.textContent).toBe(doc.heading);
    expect(screen.getByText('una introducción de prueba')).toBeTruthy();
  });

  it('renders one list item per bullet', () => {
    const { container } = render(<ClassifiedContent doc={doc} />);
    const items = container.querySelectorAll('li');
    expect(items.length).toBe(doc.bullets.length);
    expect(screen.getByText('primer punto')).toBeTruthy();
    expect(screen.getByText('tercer punto')).toBeTruthy();
  });

  it('always renders the CLASIFICADO stamp', () => {
    render(<ClassifiedContent doc={doc} />);
    expect(screen.getByText('CLASIFICADO')).toBeTruthy();
  });

  it('renders a real fixture doc (area51) with redacted bars', () => {
    const { container } = render(<ClassifiedContent doc={CLASSIFIED_DOCS.area51} />);
    expect(screen.getByText('// TOP SECRET //')).toBeTruthy();
    expect(screen.getByText(CLASSIFIED_DOCS.area51.heading)).toBeTruthy();
    // The JSX-rich intro/bullets embed <Redacted /> bars (aria-hidden spans).
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
  });
});
