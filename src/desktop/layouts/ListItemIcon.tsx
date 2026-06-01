import type { ListItem } from './types';

/**
 * Renders a ListItem's icon following the canonical rule: `iconSrc` (raster/svg)
 * wins over `graphic` (emoji/inline node). Shared by the grid and list layouts
 * so a third layout can't re-diverge on the precedence or the loading hints.
 */
export default function ListItemIcon({
  item,
  size,
  imgClassName,
}: {
  item: ListItem;
  size: number;
  imgClassName?: string;
}) {
  if (item.iconSrc) {
    return (
      <img
        src={item.iconSrc}
        alt=""
        width={size}
        height={size}
        className={imgClassName}
        loading="lazy"
        decoding="async"
      />
    );
  }
  return <>{item.graphic ?? null}</>;
}
