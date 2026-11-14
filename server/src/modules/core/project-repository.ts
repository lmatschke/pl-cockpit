import {
  PROJECT_COLORS,
  nameKey,
  projectCreateSchema,
  projectUpdateSchema,
  type ArchivedFilter,
  type Project,
} from '../../../../shared/schemas/core.js';
import type { Database } from '../../db/database.js';
import { ConflictError, NotFoundError } from '../../http-errors.js';

interface ProjectRow {
  id: number;
  name: string;
  short_name: string | null;
  color: string;
  description: string | null;
  archived: number;
  created_at: string;
  updated_at: string;
}

const collator = new Intl.Collator('de', { sensitivity: 'base' });

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name,
    color: row.color,
    description: row.description,
    archived: row.archived === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class ProjectRepository {
  constructor(private readonly db: Database) {}

  list({ archived }: { archived: ArchivedFilter }): Project[] {
    const where = archived === 'all' ? '' : 'WHERE archived = ?';
    const params = archived === 'all' ? [] : [archived === 'true' ? 1 : 0];
    const rows = this.db
      .prepare(`SELECT * FROM projects ${where}`)
      .all(...params) as unknown as ProjectRow[];
    return rows.map(toProject).sort((a, b) => collator.compare(a.name, b.name));
  }

  get(id: number): Project | undefined {
    const row = this.db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as
      ProjectRow | undefined;
    return row ? toProject(row) : undefined;
  }

  /** Validates and creates a project; accepts raw (untrusted) input. */
  create(input: unknown): Project {
    const data = projectCreateSchema.parse(input);
    this.assertNameFree(data.name);

    const now = new Date().toISOString();
    const color = data.color ?? this.nextColor();
    const result = this.db
      .prepare(
        `INSERT INTO projects (name, name_key, short_name, color, description, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(data.name, nameKey(data.name), data.shortName, color, data.description, now, now);
    return this.get(Number(result.lastInsertRowid))!;
  }

  /** Validates and applies a partial update; only given fields change. */
  update(id: number, input: unknown): Project {
    const data = projectUpdateSchema.parse(input);
    const current = this.get(id);
    if (!current) throw new NotFoundError('Projekt nicht gefunden.');
    if (data.name !== undefined) this.assertNameFree(data.name, id);

    const columns: Record<string, string | number | null> = {};
    if (data.name !== undefined) {
      columns.name = data.name;
      columns.name_key = nameKey(data.name);
    }
    if (data.shortName !== undefined) columns.short_name = data.shortName;
    if (data.color !== undefined) columns.color = data.color;
    if (data.description !== undefined) columns.description = data.description;
    if (data.archived !== undefined) columns.archived = data.archived ? 1 : 0;
    columns.updated_at = new Date().toISOString();

    const assignments = Object.keys(columns).map((c) => `${c} = ?`);
    this.db
      .prepare(`UPDATE projects SET ${assignments.join(', ')} WHERE id = ?`)
      .run(...Object.values(columns), id);
    return this.get(id)!;
  }

  private assertNameFree(name: string, exceptId?: number) {
    const row = this.db.prepare('SELECT id FROM projects WHERE name_key = ?').get(nameKey(name)) as
      { id: number } | undefined;
    if (row && row.id !== exceptId) {
      throw new ConflictError(`Ein Projekt mit dem Namen „${name}“ existiert bereits.`);
    }
  }

  private nextColor(): string {
    const { n } = this.db.prepare('SELECT COUNT(*) AS n FROM projects').get() as { n: number };
    return PROJECT_COLORS[n % PROJECT_COLORS.length]!;
  }
}
