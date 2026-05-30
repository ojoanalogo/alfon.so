const SIZE_POOL = ['512 B', '4 KB', '12 KB', '48 KB', '128 KB', '847 KB', '1.2 MB', '4.7 MB', '24 MB'];

export function fakeFileSize(id: string, kind: string): string {
  if (/carpeta/i.test(kind)) return '—';

  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash + id.charCodeAt(index) * (index + 1)) % SIZE_POOL.length;
  }
  return SIZE_POOL[hash]!;
}
