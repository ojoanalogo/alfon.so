export interface DesktopColorOption {
  id: string;
  label: string;
  /** `default` follows the active theme background token. */
  value: string | 'default';
}

export const DESKTOP_COLORS: DesktopColorOption[] = [
  { id: 'default', label: 'Automático', value: 'default' },
  { id: 'stone', label: 'Piedra', value: '#a8a29e' },
  { id: 'graphite', label: 'Grafito', value: '#57534e' },
  { id: 'slate', label: 'Pizarra', value: '#64748b' },
  { id: 'sky', label: 'Cielo', value: '#7dd3fc' },
  { id: 'blue', label: 'Azul', value: '#60a5fa' },
  { id: 'indigo', label: 'Índigo', value: '#818cf8' },
  { id: 'purple', label: 'Púrpura', value: '#c084fc' },
  { id: 'pink', label: 'Rosa', value: '#f472b6' },
  { id: 'red', label: 'Rojo', value: '#f87171' },
  { id: 'orange', label: 'Naranja', value: '#fb923c' },
  { id: 'yellow', label: 'Amarillo', value: '#facc15' },
  { id: 'green', label: 'Verde', value: '#4ade80' },
  { id: 'mint', label: 'Menta', value: '#2dd4bf' },
];

export function resolveDesktopColorValue(
  colorId: string,
  colors: DesktopColorOption[] = DESKTOP_COLORS,
): string {
  const option = colors.find((color) => color.id === colorId) ?? colors[0];
  if (!option || option.value === 'default') {
    return 'var(--color-background)';
  }
  return option.value;
}
