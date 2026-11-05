import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Systems — the project writeups.
 * Each entry is a real technical account: what it is, what was hard, what changed.
 */
const systems = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/systems' }),
  schema: z.object({
    title: z.string(),
    /** Two-word internal designation, e.g. "GROUND SEGMENT". */
    designation: z.string(),
    summary: z.string(),
    /** Your role on it. Be specific: "solo", "firmware lead", etc. */
    role: z.string(),
    period: z.string(),
    status: z.enum(['operational', 'in service', 'archived', 'ongoing']),
    stack: z.array(z.string()).default([]),
    repo: z.string().url().optional(),
    live: z.string().url().optional(),
    /** Lower sorts first. */
    order: z.number().default(100),
    featured: z.boolean().default(false),
  }),
});

const log = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/log' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { systems, log };
