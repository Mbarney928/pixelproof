import { readFile, writeFile } from 'node:fs/promises';

import { SnapshotIdSchema, ThemeSchema, ViewportSchema } from '@pixelproof/core/schema';
import { z } from 'zod';

import { UserError } from './errors.js';

export const ManifestEntrySchema = z.object({
  id: SnapshotIdSchema,
  name: z.string(),
  group: z.string(),
  url: z.string(),
  viewport: ViewportSchema,
  theme: ThemeSchema,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  /** False when consecutive screenshots never matched (animation, late content): a flakiness hint. */
  stable: z.boolean(),
});

export const ManifestSchema = z.object({
  version: z.literal(1),
  updatedAt: z.iso.datetime(),
  entries: z.array(ManifestEntrySchema),
});

export type ManifestEntry = z.infer<typeof ManifestEntrySchema>;
export type Manifest = z.infer<typeof ManifestSchema>;

export async function readManifest(path: string): Promise<Manifest | undefined> {
  let text: string;
  try {
    text = await readFile(path, 'utf8');
  } catch {
    return undefined;
  }
  const parsed = ManifestSchema.safeParse(JSON.parse(text));
  if (!parsed.success)
    throw new UserError(`Manifest ${path} is invalid: ${parsed.error.issues[0]?.message ?? ''}`);
  return parsed.data;
}

export async function writeManifest(
  path: string,
  entries: readonly ManifestEntry[],
  now: Date,
): Promise<void> {
  const manifest: Manifest = {
    version: 1,
    updatedAt: now.toISOString(),
    entries: [...entries].sort((a, b) => a.id.localeCompare(b.id)),
  };
  await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`);
}
