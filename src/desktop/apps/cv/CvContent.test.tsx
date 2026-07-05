import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CvContent from './CvContent';

describe('CvContent', () => {
  it('renders the CV placeholder heading and coming-soon message', () => {
    render(<CvContent />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('mi_cv_final_FINAL_v7.doc');
    expect(screen.getByText(/pronto — estamos armando el cv/i)).toBeTruthy();
    expect(screen.getByText('soon')).toBeTruthy();
  });
});
