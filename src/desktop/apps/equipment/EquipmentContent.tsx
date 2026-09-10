import {
  BackpackIcon,
  DeviceMobileIcon,
  DeviceTabletIcon,
  HeadphonesIcon,
  KeyboardIcon,
  LaptopIcon,
  MusicNotesSimpleIcon,
  type Icon,
} from '@phosphor-icons/react';
import { EQUIPMENT, EQUIPMENT_INTRO, type EquipmentItem } from './data';

const EQUIPMENT_ICONS: Record<EquipmentItem['id'], Icon> = {
  macbook: LaptopIcon,
  xm4: HeadphonesIcon,
  beats: MusicNotesSimpleIcon,
  'ipad-mini': DeviceTabletIcon,
  iphone: DeviceMobileIcon,
  keychron: KeyboardIcon,
  kadet: BackpackIcon,
};

function EquipmentGlyph({ itemId }: { itemId: EquipmentItem['id'] }) {
  const IconComponent = EQUIPMENT_ICONS[itemId];
  return (
    <span
      className="flex size-8 shrink-0 items-center justify-center border border-[color:var(--color-hairline)] bg-[var(--color-control-fill-strong)]"
      aria-hidden
    >
      <IconComponent size={16} weight="regular" className="text-zinc-700 dark:text-zinc-400" />
    </span>
  );
}

export default function EquipmentContent() {
  return (
    <div className="mx-auto max-w-2xl space-y-3 text-xs sm:space-y-2">
      <header className="mb-3 flex flex-col gap-1 sm:mb-4">
        <h1 className="text-base leading-snug sm:text-lg">equipo</h1>
        <p className="text-xs text-muted">{EQUIPMENT_INTRO}</p>
      </header>

      <ul
        className="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2"
        aria-label="Equipo actual"
      >
        {EQUIPMENT.map((item) => (
          <li
            key={item.id}
            className="flex gap-2.5 rounded-lg bg-stone-300/70 p-3 dark:bg-gray-500/10"
          >
            <EquipmentGlyph itemId={item.id} />
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="font-medium text-primary">{item.name}</p>
              <p className="text-muted">{item.category}</p>
              <p className="leading-relaxed text-secondary">{item.blurb}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
