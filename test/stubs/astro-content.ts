// Stub for the `astro:content` virtual module (aliased in vitest.config.ts).
// Defaults are inert; tests that need real data should `vi.mock('astro:content', …)`
// to override, e.g. `getCollection`.

export type CollectionEntry<_T extends string = string> = {
  id: string;
  body?: string;
  data: Record<string, unknown> & { publishDate?: string | Date; published?: boolean };
  rendered?: { html?: string };
};

export type SchemaContext = { image: () => unknown };

export const getCollection = async (
  _collection: string,
  filter?: (entry: CollectionEntry) => boolean,
): Promise<CollectionEntry[]> => {
  void filter;
  return [];
};

export const render = async (_entry: CollectionEntry) => ({
  Content: () => null,
});

export const defineCollection = <T>(config: T): T => config;
