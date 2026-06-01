/**
 * Cascade window positions like a classic OS — each window stepped down-right
 * from a base anchor. Used to lay out the dynamic per-post windows (see
 * `createPostApps`).
 */
export function cascadeOffset(index: number, options: { baseX: number; baseY: number; pitch?: number }): { x: number; y: number } {
  const { baseX, baseY, pitch = 28 } = options;
  return { x: baseX + index * pitch, y: baseY + index * pitch };
}
