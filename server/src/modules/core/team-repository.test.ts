import { beforeEach, describe, expect, it } from 'vitest';
import { ConflictError, NotFoundError } from '../../http-errors.js';
import { createTestDb } from '../../test-utils.js';
import { TeamRepository } from './team-repository.js';

let repo: TeamRepository;

beforeEach(() => {
  repo = new TeamRepository(createTestDb());
});

describe('TeamRepository', () => {
  it('creates a team', () => {
    const t = repo.create({ name: '  Team Nord ' });
    expect(t).toMatchObject({ id: expect.any(Number), name: 'Team Nord', archived: false });
    expect(t.updatedAt).toBe(t.createdAt);
  });

  it('validates the name', () => {
    expect(() => repo.create({ name: '' })).toThrow();
    expect(() => repo.create({ name: 'x'.repeat(81) })).toThrow();
  });

  it('rejects duplicate names regardless of case', () => {
    repo.create({ name: 'Team Nord-Ost' });
    expect(() => repo.create({ name: 'team nord-ost' })).toThrow(ConflictError);
  });

  it('allows a project and a team with the same name', async () => {
    const { ProjectRepository } = await import('./project-repository.js');
    const db = createTestDb();
    new ProjectRepository(db).create({ name: 'Plattform' });
    expect(new TeamRepository(db).create({ name: 'Plattform' }).name).toBe('Plattform');
  });

  it('renames, archives and restores', () => {
    const t = repo.create({ name: 'Team Nord' });
    repo.create({ name: 'Team Süd' });

    expect(repo.update(t.id, { name: 'Team Nord-Ost' }).name).toBe('Team Nord-Ost');
    repo.update(t.id, { archived: true });

    expect(repo.list({ archived: 'false' }).map((x) => x.name)).toEqual(['Team Süd']);
    expect(repo.list({ archived: 'true' }).map((x) => x.name)).toEqual(['Team Nord-Ost']);
    expect(repo.update(t.id, { archived: false }).archived).toBe(false);
  });

  it('rejects renaming to another team name and unknown ids', () => {
    repo.create({ name: 'A' });
    const b = repo.create({ name: 'B' });
    expect(() => repo.update(b.id, { name: 'a' })).toThrow(ConflictError);
    expect(() => repo.update(999, { name: 'X' })).toThrow(NotFoundError);
  });
});
