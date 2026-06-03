import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AppLoading from './AppLoading';

describe('AppLoading', () => {
  it('renders the loading placeholder text', () => {
    render(<AppLoading />);
    expect(screen.getByText('cargando…')).toBeTruthy();
  });
});
