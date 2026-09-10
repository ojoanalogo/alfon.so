import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EquipmentContent from './EquipmentContent';
import { EQUIPMENT, EQUIPMENT_INTRO } from './data';

describe('EquipmentContent', () => {
  it('renders the heading, intro, and every kit item', () => {
    render(<EquipmentContent />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('equipo');
    expect(screen.getByText(EQUIPMENT_INTRO)).toBeTruthy();
    expect(screen.getByRole('list', { name: /equipo actual/i })).toBeTruthy();

    for (const item of EQUIPMENT) {
      expect(screen.getByText(item.name)).toBeTruthy();
      expect(screen.getByText(item.blurb)).toBeTruthy();
    }
  });

  it('renders one list item per piece of equipment', () => {
    render(<EquipmentContent />);
    const list = screen.getByRole('list', { name: /equipo actual/i });
    expect(list.querySelectorAll('li')).toHaveLength(EQUIPMENT.length);
  });
});
