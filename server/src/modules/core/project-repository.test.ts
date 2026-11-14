import { beforeEach, describe, expect, it } from 'vitest';
import { PROJECT_COLORS } from '../../../../shared/schemas/core.js';
import { ConflictError } from '../../http-errors.js';
import { createTestDb } from '../../test-utils.js';
import { ProjectRepository } from './project-repository.js';

let repo: ProjectRepository;

beforeEach(() => {
  repo = new ProjectRepository(createTestDb());
});

describe('ProjectRepository', () => {
  it('creates a project with defaults', () => {
    const p = repo.create({ name: 'CRM Release 3' });

    expect(p).toMatchObject({
      id: expect.any(Number),
      name: 'CRM Release 3',
      shortName: null,
      description: null,
      color: PROJECT_COLORS[0],
      archived: false,
    });
    expect(p.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(p.updatedAt).toBe(p.createdAt);
  });

  it('assigns the next palette color to each new project', () => {
    const a = repo.create({ name: 'A' });
    const b = repo.create({ name: 'B' });
    expect([a.color, b.color]).toEqual([PROJECT_COLORS[0], PROJECT_COLORS[1]]);
  });

  it('keeps an explicitly chosen color', () => {
    expect(repo.create({ name: 'A', color: '#123abc' }).color).toBe('#123abc');
  });

  it('rejects duplicate names regardless of case, including umlauts', () => {
    repo.create({ name: 'Änderungsmanagement' });
    expect(() => repo.create({ name: 'änderungsMANAGEMENT' })).toThrow(ConflictError);
  });

  it('lists projects sorted by name (German collation)', () => {
    repo.create({ name: 'Zeiterfassung' });
    repo.create({ name: 'Änderung' });
    repo.create({ name: 'Billing' });

    expect(repo.list({ archived: 'false' }).map((p) => p.name)).toEqual([
      'Änderung',
      'Billing',
      'Zeiterfassung',
    ]);
  });
});
