import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { SettingsSection } from '@desktop/wrappers';
import SettingsBody from './SettingsBody';

describe('SettingsBody', () => {
  it('renders a heading and body for each titled section', () => {
    const sections: SettingsSection[] = [
      { id: 'apariencia', title: 'Apariencia', render: () => <p>cuerpo-apariencia</p> },
      { id: 'red', title: 'Red', render: () => <p>cuerpo-red</p> },
    ];

    render(<SettingsBody sections={sections} />);

    expect(screen.getByText('Apariencia').tagName).toBe('H3');
    expect(screen.getByText('Red').tagName).toBe('H3');
    expect(screen.getByText('cuerpo-apariencia')).toBeTruthy();
    expect(screen.getByText('cuerpo-red')).toBeTruthy();
  });

  it('links each section to its heading via aria-labelledby + matching id', () => {
    const sections: SettingsSection[] = [
      { id: 'apariencia', title: 'Apariencia', render: () => <p>body</p> },
    ];

    const { container } = render(<SettingsBody sections={sections} />);

    const section = container.querySelector('section');
    expect(section?.getAttribute('aria-labelledby')).toBe('settings-apariencia-heading');
    const heading = container.querySelector('h3');
    expect(heading?.id).toBe('settings-apariencia-heading');
  });

  it('omits the heading and aria-labelledby when a section has no title', () => {
    const sections: SettingsSection[] = [{ id: 'plain', render: () => <p>solo-cuerpo</p> }];

    const { container } = render(<SettingsBody sections={sections} />);

    expect(container.querySelector('h3')).toBeNull();
    expect(screen.getByText('solo-cuerpo')).toBeTruthy();
    const section = container.querySelector('section');
    expect(section?.getAttribute('aria-labelledby')).toBeNull();
  });

  it('calls each section render() exactly once and preserves order', () => {
    const renderA = vi.fn(() => <p>A</p>);
    const renderB = vi.fn(() => <p>B</p>);
    const sections: SettingsSection[] = [
      { id: 'a', title: 'A title', render: renderA },
      { id: 'b', title: 'B title', render: renderB },
    ];

    const { container } = render(<SettingsBody sections={sections} />);

    expect(renderA).toHaveBeenCalledTimes(1);
    expect(renderB).toHaveBeenCalledTimes(1);

    const headings = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent);
    expect(headings).toEqual(['A title', 'B title']);
  });

  it('renders nothing-but-container when there are no sections', () => {
    const { container } = render(<SettingsBody sections={[]} />);

    expect(container.querySelector('section')).toBeNull();
    expect(container.querySelector('div')).toBeTruthy();
  });
});
