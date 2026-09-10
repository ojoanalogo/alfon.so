import { describe, it, expect } from 'vitest';
import { EQUIPMENT, EQUIPMENT_INTRO, terminalCatEquipmentLines, type EquipmentItem } from './data';

describe('EQUIPMENT', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(EQUIPMENT)).toBe(true);
    expect(EQUIPMENT.length).toBeGreaterThan(0);
  });

  it('every entry has the required string fields', () => {
    for (const item of EQUIPMENT) {
      expect(typeof item.id).toBe('string');
      expect(item.id.trim().length).toBeGreaterThan(0);
      expect(typeof item.name).toBe('string');
      expect(item.name.trim().length).toBeGreaterThan(0);
      expect(typeof item.category).toBe('string');
      expect(item.category.trim().length).toBeGreaterThan(0);
      expect(typeof item.blurb).toBe('string');
      expect(item.blurb.trim().length).toBeGreaterThan(0);
    }
  });

  it('has unique ids and names', () => {
    expect(new Set(EQUIPMENT.map((item) => item.id)).size).toBe(EQUIPMENT.length);
    expect(new Set(EQUIPMENT.map((item) => item.name)).size).toBe(EQUIPMENT.length);
  });

  it('does not carry any unexpected keys on entries', () => {
    const allowed = new Set<keyof EquipmentItem>(['id', 'name', 'category', 'blurb']);
    for (const item of EQUIPMENT) {
      for (const key of Object.keys(item)) {
        expect(allowed.has(key as keyof EquipmentItem)).toBe(true);
      }
    }
  });

  it('includes the current kit', () => {
    const names = EQUIPMENT.map((item) => item.name);
    expect(names).toEqual([
      'MacBook Pro M5',
      'Sony WH-1000XM4',
      'Beats Fit Pro',
      'iPad mini (7ª gen)',
      'iPhone 16e',
      'Keychron K8',
      'Chrome Kadet',
    ]);
  });
});

describe('terminalCatEquipmentLines', () => {
  it('lists the intro and every piece of equipment', () => {
    const lines = terminalCatEquipmentLines();
    expect(lines[0]).toBe(`equipo — ${EQUIPMENT_INTRO}`);
    for (const item of EQUIPMENT) {
      expect(lines.some((line) => line.includes(item.name) && line.includes(item.category))).toBe(
        true,
      );
    }
  });
});
