import macbook from '../../../assets/equipment/macbook-top.png?url';
import xm4 from '../../../assets/equipment/sony-xm4-top.png?url';
import beats from '../../../assets/equipment/beats-fit-pro-top.png?url';
import ipadMini from '../../../assets/equipment/ipad-mini-top.png?url';
import iphone from '../../../assets/equipment/iphone-16e-top.png?url';
import keychron from '../../../assets/equipment/keychron-k8-top.png?url';
import kadet from '../../../assets/equipment/chrome-kadet-top.png?url';
import wood from '../../../assets/equipment/wood-table.jpg?url';
import { EQUIPMENT, EQUIPMENT_INTRO } from './data';

const EQUIPMENT_IMAGES: Record<(typeof EQUIPMENT)[number]['id'], string> = {
  macbook,
  xm4,
  beats,
  'ipad-mini': ipadMini,
  iphone,
  keychron,
  kadet,
};

export default function EquipmentContent() {
  return (
    <section
      className="equipment-table relative isolate h-full overflow-hidden"
      aria-labelledby="equipment-heading"
    >
      <img
        src={wood}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div
        className="pointer-events-none absolute inset-0 shadow-[inset_0_0_40px_rgb(40_18_0_/_0.5),inset_0_1px_0_rgb(255_255_255_/_0.18)]"
        aria-hidden
      />

      <header className="absolute top-2 left-1/2 z-20 w-max max-w-[12rem] -translate-x-1/2 rounded-[0.15rem] border border-[#8b6914]/50 bg-[#efe4c8]/92 px-2 py-1 text-center shadow-[1px_2px_0_rgb(0_0_0_/_0.18)]">
        <h1 id="equipment-heading" className="text-[0.7rem] leading-tight text-[#3f2a12]">
          equipo
        </h1>
        <p className="text-[0.55rem] leading-snug text-[#6b4a28]">{EQUIPMENT_INTRO}</p>
      </header>

      <ul className="absolute inset-0 m-0 list-none p-0" aria-label="Equipo actual">
        {EQUIPMENT.map((item) => {
          const { left, top, width, rotate, z } = item.layout;
          const captionAbove = Number.parseFloat(item.layout.top) > 50;
          return (
            <li
              key={item.id}
              className="absolute"
              style={{ left, top, width, zIndex: z, transform: `rotate(${rotate})` }}
            >
              <button
                type="button"
                className="group relative block w-full cursor-pointer border-0 bg-transparent p-0 text-left"
                aria-label={`${item.name}, ${item.category}. ${item.blurb}`}
              >
                <img
                  src={EQUIPMENT_IMAGES[item.id]}
                  alt=""
                  draggable={false}
                  className="block w-full drop-shadow-[2px_8px_12px_rgb(0_0_0_/_0.42)] transition-transform duration-200 group-hover:scale-105 group-focus:scale-105"
                />
                <span
                  className={[
                    'pointer-events-none absolute left-1/2 z-10 w-max max-w-36 -translate-x-1/2 rounded-[0.15rem] border border-[#8b6914]/40 bg-[#efe4c8]/95 px-1.5 py-0.5 text-center text-[0.55rem] leading-tight text-[#3f2a12] opacity-0 shadow-sm group-hover:opacity-100 group-focus:opacity-100',
                    captionAbove ? 'bottom-full mb-1' : 'top-full mt-1',
                  ].join(' ')}
                >
                  <span className="block font-medium">{item.name}</span>
                  <span className="block text-[#6b4a28]">
                    {item.category} · {item.blurb}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
