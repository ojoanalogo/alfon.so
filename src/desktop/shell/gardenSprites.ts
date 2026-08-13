/** Color Pixels sprites from Icons8 (https://icons8.com). */
import cactus from '../../assets/garden/cactus.png?url';
import flower from '../../assets/garden/flower.png?url';
import forest from '../../assets/garden/forest.png?url';
import leaf from '../../assets/garden/leaf.png?url';
import lotus from '../../assets/garden/lotus.png?url';
import mushroom from '../../assets/garden/mushroom.png?url';
import palmTree from '../../assets/garden/palm-tree.png?url';
import pottedPlant from '../../assets/garden/potted-plant.png?url';
import rose from '../../assets/garden/rose.png?url';
import sprout from '../../assets/garden/sprout.png?url';
import strawberry from '../../assets/garden/strawberry.png?url';
import sunflower from '../../assets/garden/sunflower.png?url';
import wheat from '../../assets/garden/wheat.png?url';

export interface GardenSprite {
  src: string;
  /** Rendered width/height in CSS pixels. */
  size: number;
  /** Extra lift from the soil line, in CSS pixels. */
  lift: number;
  opacity: number;
  flip?: boolean;
}

/** One organic motif — repeated to fill the desktop width. */
export const GARDEN_MOTIF: GardenSprite[] = [
  { src: forest, size: 76, lift: 2, opacity: 0.86 },
  { src: sprout, size: 34, lift: 0, opacity: 0.68 },
  { src: sunflower, size: 54, lift: 6, opacity: 0.9 },
  { src: leaf, size: 30, lift: 10, opacity: 0.62, flip: true },
  { src: pottedPlant, size: 50, lift: 0, opacity: 0.88 },
  { src: wheat, size: 40, lift: 4, opacity: 0.74 },
  { src: flower, size: 44, lift: 8, opacity: 0.86 },
  { src: cactus, size: 48, lift: 0, opacity: 0.84 },
  { src: mushroom, size: 32, lift: 0, opacity: 0.72 },
  { src: palmTree, size: 70, lift: 2, opacity: 0.88 },
  { src: rose, size: 42, lift: 6, opacity: 0.86, flip: true },
  { src: sprout, size: 28, lift: 0, opacity: 0.64, flip: true },
  { src: lotus, size: 46, lift: 8, opacity: 0.84 },
  { src: strawberry, size: 34, lift: 2, opacity: 0.78 },
  { src: forest, size: 64, lift: 0, opacity: 0.8, flip: true },
  { src: sunflower, size: 40, lift: 4, opacity: 0.76 },
];

/** Enough repeats to cover ultrawide desktops without measuring. */
export const GARDEN_REPEAT = 6;

export function gardenSprites(repeat = GARDEN_REPEAT): GardenSprite[] {
  return Array.from({ length: repeat }, () => GARDEN_MOTIF).flat();
}
