// Stub for the `astro:assets` virtual module (aliased in vitest.config.ts).

type ImageInput = string | { src?: string };

export const getImage = async ({ src }: { src: ImageInput; [k: string]: unknown }) => ({
  src: typeof src === 'string' ? src : (src?.src ?? ''),
});
