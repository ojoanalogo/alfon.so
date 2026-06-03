import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HappyContent from './HappyContent';

describe('HappyContent', () => {
  it('renders the recovered-file teaser text', () => {
    render(<HappyContent />);
    expect(screen.getByText(/archivo recuperado/i)).toBeTruthy();
  });

  it('embeds the YouTube iframe with the expected src and title', () => {
    const { container } = render(<HappyContent />);
    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute('title')).toBe('YouTube video player');
    expect(iframe?.getAttribute('src')).toContain('youtube.com/embed/I_NkBrDmGxM');
    expect(iframe?.hasAttribute('allowfullscreen')).toBe(true);
  });
});
