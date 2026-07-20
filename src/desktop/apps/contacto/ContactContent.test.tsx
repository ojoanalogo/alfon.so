import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ContactContent from './ContactContent';

describe('ContactContent', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, href: '' },
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('renders a Mail-style compose form addressed to the site inbox', () => {
    render(<ContactContent />);
    expect(screen.getByRole('toolbar', { name: /correo/i })).toBeTruthy();
    expect(screen.getByText('Para')).toBeTruthy();
    expect(screen.getByText(/hola@alfon\.so/i)).toBeTruthy();
    expect(screen.getByText('Asunto')).toBeTruthy();
    expect(screen.getByRole('button', { name: /enviar/i })).toBeTruthy();
    expect(screen.getByText(/abre el borrador en tu app de correo/i)).toBeTruthy();
  });

  it('opens a mailto link with subject and body instead of sending in-app', () => {
    render(<ContactContent />);
    fireEvent.change(screen.getByPlaceholderText(/hola desde alfon\.so/i), {
      target: { value: 'hola' },
    });
    fireEvent.change(screen.getByPlaceholderText(/escribe tu mensaje/i), {
      target: { value: 'qué tal' },
    });
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }));

    expect(window.location.href).toBe('mailto:hola@alfon.so?subject=hola&body=qu%C3%A9+tal');
  });
});
