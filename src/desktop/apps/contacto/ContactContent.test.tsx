import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ContactContent from './ContactContent';

describe('ContactContent', () => {
  it('renders inbox contact info with the mailto address', () => {
    render(<ContactContent />);
    expect(screen.getByText(/alfonso reyes.*hola@alfon\.so/i)).toBeTruthy();
  });
});
