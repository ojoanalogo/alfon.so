export interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  blurb: string;
}

export const EQUIPMENT: EquipmentItem[] = [
  {
    id: 'macbook',
    name: 'MacBook Pro M5',
    category: 'laptop',
    blurb: 'la máquina de todos los días',
  },
  {
    id: 'xm4',
    name: 'Sony WH-1000XM4',
    category: 'audífonos',
    blurb: 'cancelación de ruido para la ciudad',
  },
  {
    id: 'beats',
    name: 'Beats Fit Pro',
    category: 'audífonos',
    blurb: 'para correr y el camino',
  },
  {
    id: 'ipad-mini',
    name: 'iPad mini (7ª gen)',
    category: 'tablet',
    blurb: 'apuntes, lectura y dibujo',
  },
  {
    id: 'iphone',
    name: 'iPhone 16e',
    category: 'teléfono',
    blurb: 'el bolsillo',
  },
  {
    id: 'keychron',
    name: 'Keychron K8',
    category: 'teclado',
    blurb: 'mecánico, inalámbrico',
  },
  {
    id: 'kadet',
    name: 'Chrome Kadet',
    category: 'bolso',
    blurb: 'el sling para la cámara y el portátil',
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
