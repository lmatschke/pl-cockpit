import { beforeEach, describe, expect, it } from 'vitest';
import { PROJECT_COLORS } from '../../../../shared/schemas/core.js';
import { ConflictError, NotFoundError } from '../../http-errors.js';
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

describe('ProjectRepository.update', () => {
  it('changes only the given fields and bumps updatedAt', async () => {
    const p = repo.create({ name: 'CRM', shortName: 'CRM', description: 'Alt' });
    await new Promise((r) => setTimeout(r, 5));

    const u = repo.update(p.id, { description: 'Neu' });

    expect(u).toMatchObject({ name: 'CRM', shortName: 'CRM', description: 'Neu', color: p.color });
    expect(u.updatedAt > p.updatedAt).toBe(true);
    expect(u.createdAt).toBe(p.createdAt);
  });

  it('clears optional fields when given an empty string or null', () => {
    const p = repo.create({ name: 'CRM', shortName: 'CRM', description: 'Alt' });
    expect(repo.update(p.id, { shortName: '', description: null })).toMatchObject({
      shortName: null,
      description: null,
    });
  });

  it('allows renaming a project to a different case of its own name', () => {
    const p = repo.create({ name: 'crm' });
    expect(repo.update(p.id, { name: 'CRM' }).name).toBe('CRM');
  });

  it('rejects renaming to the name of another project', () => {
    repo.create({ name: 'A' });
    const b = repo.create({ name: 'B' });
    expect(() => repo.update(b.id, { name: 'a' })).toThrow(ConflictError);
  });

  it('archives and unarchives', () => {
    const p = repo.create({ name: 'A' });
    repo.create({ name: 'B' });

    repo.update(p.id, { archived: true });
    expect(repo.list({ archived: 'false' }).map((x) => x.name)).toEqual(['B']);
    expect(repo.list({ archived: 'true' }).map((x) => x.name)).toEqual(['A']);
    expect(repo.list({ archived: 'all' })).toHaveLength(2);

    repo.update(p.id, { archived: false });
    expect(repo.list({ archived: 'false' })).toHaveLength(2);
  });

  it('throws NotFoundError for an unknown id', () => {
    expect(() => repo.update(999, { name: 'X' })).toThrow(NotFoundError);
  });
});
