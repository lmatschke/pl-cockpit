import {
  nameKey,
  teamCreateSchema,
  teamUpdateSchema,
  type ArchivedFilter,
  type Team,
} from '../../../../shared/schemas/core.js';
import type { Database } from '../../db/database.js';
import { ConflictError, NotFoundError } from '../../http-errors.js';

interface TeamRow {
  id: number;
  name: string;
  archived: number;
  created_at: string;
  updated_at: string;
}

const collator = new Intl.Collator('de', { sensitivity: 'base' });

function toTeam(row: TeamRow): Team {
  return {
    id: row.id,
    name: row.name,
    archived: row.archived === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class TeamRepository {
  constructor(private readonly db: Database) {}

  list({ archived }: { archived: ArchivedFilter }): Team[] {
    const where = archived === 'all' ? '' : 'WHERE archived = ?';
    const params = archived === 'all' ? [] : [archived === 'true' ? 1 : 0];
    const rows = this.db
      .prepare(`SELECT * FROM teams ${where}`)
      .all(...params) as unknown as TeamRow[];
    return rows.map(toTeam).sort((a, b) => collator.compare(a.name, b.name));
  }

  get(id: number): Team | undefined {
    const row = this.db.prepare('SELECT * FROM teams WHERE id = ?').get(id) as TeamRow | undefined;
    return row ? toTeam(row) : undefined;
  }

  /** Validates and creates a team; accepts raw (untrusted) input. */
  create(input: unknown): Team {
    const { name } = teamCreateSchema.parse(input);
    this.assertNameFree(name);
    const now = new Date().toISOString();
    const result = this.db
      .prepare('INSERT INTO teams (name, name_key, created_at, updated_at) VALUES (?, ?, ?, ?)')
      .run(name, nameKey(name), now, now);
    return this.get(Number(result.lastInsertRowid))!;
  }

  /** Validates and applies a partial update (rename and/or archive). */
  update(id: number, input: unknown): Team {
    const data = teamUpdateSchema.parse(input);
    if (!this.get(id)) throw new NotFoundError('Team nicht gefunden.');

    const columns: Record<string, string | number> = {};
    if (data.name !== undefined) {
      this.assertNameFree(data.name, id);
      columns.name = data.name;
      columns.name_key = nameKey(data.name);
    }
    if (data.archived !== undefined) columns.archived = data.archived ? 1 : 0;
    columns.updated_at = new Date().toISOString();

    const assignments = Object.keys(columns).map((c) => `${c} = ?`);
    this.db
      .prepare(`UPDATE teams SET ${assignments.join(', ')} WHERE id = ?`)
      .run(...Object.values(columns), id);
    return this.get(id)!;
  }

  private assertNameFree(name: string, exceptId?: number) {
    const row = this.db.prepare('SELECT id FROM teams WHERE name_key = ?').get(nameKey(name)) as
      { id: number } | undefined;
    if (row && row.id !== exceptId) {
      throw new ConflictError(`Ein Team mit dem Namen „${name}“ existiert bereits.`);
    }
  }
}
