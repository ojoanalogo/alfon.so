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
    layout: { left: '24%', top: '16%', width: '46%', rotate: '-5deg', z: 4 },
  },
  {
    id: 'xm4',
    name: 'Sony WH-1000XM4',
    category: 'audífonos',
    blurb: 'cancelación de ruido para la ciudad',
    layout: { left: '70%', top: '2%', width: '24%', rotate: '16deg', z: 3 },
  },
  {
    id: 'beats',
    name: 'Beats Fit Pro',
    category: 'audífonos',
    blurb: 'para correr y el camino',
    layout: { left: '78%', top: '62%', width: '16%', rotate: '-10deg', z: 4 },
  },
  {
    id: 'ipad-mini',
    name: 'iPad mini (7ª gen)',
    category: 'tablet',
    blurb: 'apuntes, lectura y dibujo',
    layout: { left: '5%', top: '46%', width: '15%', rotate: '-9deg', z: 3 },
  },
  {
    id: 'iphone',
    name: 'iPhone 16e',
    category: 'teléfono',
    blurb: 'el bolsillo',
    layout: { left: '69%', top: '40%', width: '10%', rotate: '12deg', z: 5 },
  },
  {
    id: 'keychron',
    name: 'Keychron K8',
    category: 'teclado',
    blurb: 'mecánico, inalámbrico',
    layout: { left: '26%', top: '64%', width: '40%', rotate: '3deg', z: 5 },
  },
  {
    id: 'kadet',
    name: 'Chrome Kadet',
    category: 'bolso',
    blurb: 'el sling para la cámara y el portátil',
    layout: { left: '2%', top: '8%', width: '18%', rotate: '-18deg', z: 2 },
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
