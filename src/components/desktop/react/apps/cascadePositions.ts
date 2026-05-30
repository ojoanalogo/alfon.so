/**
 * Cascade window positions like a classic OS — each window stepped down-right
 * from a base anchor. Used to lay out the dynamic per-post windows and to seed
 * defineDynamicApps with sensible defaults.
 */
export function cascadePositions(
  count: number,
  options: { baseX: number; baseY: number; pitch?: number },
): Array<{ x: number; y: number }> {
  const { baseX, baseY, pitch = 28 } = options;
  return Array.from({ length: count }, (_, index) => ({
    x: baseX + index * pitch,
    y: baseY + index * pitch,
  }));
}

export function cascadeOffset(index: number, options: { baseX: number; baseY: number; pitch?: number }): { x: number; y: number } {
  const { baseX, baseY, pitch = 28 } = options;
  return { x: baseX + index * pitch, y: baseY + index * pitch };
}
