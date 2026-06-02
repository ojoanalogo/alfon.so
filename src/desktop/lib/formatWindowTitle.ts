/** Uppercase the first letter in the title; leave the rest unchanged. */
export function formatWindowTitle(title: string): string {
  if (!title) return title;

  const match = title.match(/\p{L}/u);
  if (!match || match.index === undefined) {
    return title.charAt(0).toLocaleUpperCase('es') + title.slice(1);
  }

  const index = match.index;
  return title.slice(0, index) + title[index].toLocaleUpperCase('es') + title.slice(index + 1);
}
