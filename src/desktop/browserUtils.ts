export function normalizeBrowserUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed || trimmed === 'about:blank') return null;

  try {
    const withProtocol = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(withProtocol);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
  } catch {
    return null;
  }

  return null;
}
