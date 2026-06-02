const HIT_PADDING_PX = 12;

export function isPointerOverTrash(
  clientX: number,
  clientY: number,
  trashEl: HTMLElement | null,
): boolean {
  if (!trashEl) return false;
  const rect = trashEl.getBoundingClientRect();
  return (
    clientX >= rect.left - HIT_PADDING_PX &&
    clientX <= rect.right + HIT_PADDING_PX &&
    clientY >= rect.top - HIT_PADDING_PX &&
    clientY <= rect.bottom + HIT_PADDING_PX
  );
}
