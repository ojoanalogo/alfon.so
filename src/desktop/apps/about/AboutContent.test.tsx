import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TECH_STACK } from '../projects/data';
import AboutContent from './AboutContent';

describe('AboutContent', () => {
  it('renders the heading with the name', () => {
    render(<AboutContent />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.id).toBe('about-heading');
    expect(heading.textContent).toContain('alfonso reyes');
  });

  it('renders the profile photo placeholder with an accessible label', () => {
    render(<AboutContent />);
    const img = screen.getByRole('img', { name: /foto de perfil/i });
    expect(img.textContent).toContain('🧑‍💻');
  });

  it('renders the external work/hobby/community links with correct hrefs', () => {
    render(<AboutContent />);
    const expected: Record<string, string> = {
      'monopolio.com.mx': 'https://monopolio.com.mx',
      'ojoanalogo.com': 'https://ojoanalogo.com',
      'cursor.com/ambassadors': 'https://cursor.com/ambassadors',
      sofia: 'https://sofinanzas.mx',
    };
    for (const [text, href] of Object.entries(expected)) {
      const link = screen.getByText(text).closest('a');
      expect(link).not.toBeNull();
      expect(link?.getAttribute('href')).toBe(href);
    }
  });

  it('renders a mailto contact link', () => {
    render(<AboutContent />);
    const mail = screen.getByText('hola@alfon.so').closest('a');
    expect(mail?.getAttribute('href')).toBe('mailto:hola@alfon.so');
  });

  it('renders every tech-stack entry as a labelled list', () => {
    const { container } = render(<AboutContent />);
    const list = container.querySelector('[aria-label="Tech stack"]');
    expect(list).not.toBeNull();
    const langs = Object.keys(TECH_STACK);
    expect(langs.length).toBeGreaterThan(0);
    for (const lang of langs) {
      const span = screen.getByText(lang);
      expect(span.getAttribute('title')).toBe(TECH_STACK[lang]);
    }
  });

  it('renders the social media icons', () => {
    const { container } = render(<AboutContent />);
    // SocialMediaIcons renders <svg> icons inside anchor links.
    expect(container.querySelectorAll('svg').length).toBeGreaterThan(0);
  });
});
