export function resolveWallpaperId(storedId: string, availableIds: Set<string>): string | null {
  if (availableIds.has(storedId)) return storedId;
  return null;
}
