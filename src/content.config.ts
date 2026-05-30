import { defineCollection, type SchemaContext } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const blogSchema = ({ image }: SchemaContext) =>
  z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
    updatedDate: z.string().optional(),
    heroImage: image().optional(),
    published: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
  });

export type BlogSchema = z.infer<ReturnType<typeof blogSchema>>;

const blogCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: blogSchema,
});

export const collections = {
  blog: blogCollection,
};
