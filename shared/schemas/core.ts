import { z } from 'zod';

/** Default colors assigned to new projects in rotation (used in timelines). */
export const PROJECT_COLORS = [
  '#2f5bd3',
  '#0f9d8a',
  '#d97706',
  '#9333ea',
  '#dc2626',
  '#0891b2',
  '#65a30d',
  '#db2777',
] as const;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Höchstens ${max} Zeichen.`)
    .nullish()
    .transform((v) => (v ? v : null));

export const projectCreateSchema = z.object(
  {
    name: z
      .string({ error: 'Bitte einen Namen eingeben.' })
      .trim()
      .min(1, 'Bitte einen Namen eingeben.')
      .max(120, 'Höchstens 120 Zeichen.'),
    shortName: optionalText(12),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, 'Bitte eine gültige Farbe wählen.')
      .optional(),
    description: optionalText(2000),
  },
  { error: 'Ungültige Eingabe.' },
);
export type ProjectCreateInput = z.input<typeof projectCreateSchema>;

export const projectUpdateSchema = projectCreateSchema
  .extend({ archived: z.boolean({ error: 'Muss wahr oder falsch sein.' }) })
  .partial();
export type ProjectUpdateInput = z.input<typeof projectUpdateSchema>;

/** Positive integer id from a URL parameter. */
export const idParamSchema = z.object({
  id: z.coerce.number({ error: 'Ungültige ID.' }).int('Ungültige ID.').positive('Ungültige ID.'),
});

export const archivedFilterSchema = z.enum(['false', 'true', 'all']).default('false');
export type ArchivedFilter = z.infer<typeof archivedFilterSchema>;

export interface Project {
  id: number;
  name: string;
  shortName: string | null;
  color: string;
  description: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Locale-aware key used for case-insensitive uniqueness of names. */
export function nameKey(name: string): string {
  return name.trim().toLocaleLowerCase('de');
}
