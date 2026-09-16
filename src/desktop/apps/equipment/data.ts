export interface EquipmentLayout {
  left: string;
  top: string;
  width: string;
  rotate: string;
  z: number;
}

export interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  blurb: string;
  layout: EquipmentLayout;
}

export const EQUIPMENT: EquipmentItem[] = [
  {
    id: 'macbook',
    name: 'MacBook Pro M5',
    category: 'laptop',
    blurb: 'la máquina de todos los días',
    layout: { left: '22%', top: '14%', width: '48%', rotate: '-4deg', z: 4 },
  },
  {
    id: 'xm4',
    name: 'Sony WH-1000XM4',
    category: 'audífonos',
    blurb: 'cancelación de ruido para la ciudad',
    layout: { left: '70%', top: '8%', width: '24%', rotate: '14deg', z: 3 },
  },
  {
    id: 'ipad-mini',
    name: 'iPad mini (7ª gen)',
    category: 'tablet',
    blurb: 'apuntes, lectura y dibujo',
    layout: { left: '4%', top: '12%', width: '16%', rotate: '-8deg', z: 3 },
  },
  {
    id: 'iphone',
    name: 'iPhone 16e',
    category: 'teléfono',
    blurb: 'el bolsillo',
    layout: { left: '78%', top: '58%', width: '10%', rotate: '10deg', z: 5 },
  },
  {
    id: 'keychron',
    name: 'Keychron K8',
    category: 'teclado',
    blurb: 'mecánico, inalámbrico',
    layout: { left: '22%', top: '62%', width: '44%', rotate: '2deg', z: 5 },
  },
];

export const EQUIPMENT_INTRO = 'lo que cargo todos los días';

/** `cat equipo` desktop file preview. */
export function terminalCatEquipmentLines(): string[] {
  const nameWidth = Math.max(...EQUIPMENT.map((item) => item.name.length));
  return [
    `equipo — ${EQUIPMENT_INTRO}`,
    '',
    ...EQUIPMENT.map((item) => `${item.name.padEnd(nameWidth + 2)}${item.category}`),
  ];
}
