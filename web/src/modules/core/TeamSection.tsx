import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { Team } from '../../../../shared/schemas/core';
import { api, ApiError } from '../../shared/api';
import { Button, SegmentedControl } from '../../shared/ui';

type View = 'active' | 'archived';

interface Notice {
  text: string;
  undo?: () => void;
}

function errorText(err: unknown): string {
  if (err instanceof ApiError) return err.fields.name ?? err.message;
  return 'Aktion fehlgeschlagen.';
}

function AddTeamForm({ onAdded }: { onAdded: (team: Team) => void }) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const team = await api.post<Team>('/api/teams', { name });
      setName('');
      onAdded(team);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="inline-form" onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor="new-team-name" className="visually-hidden">
          Name des neuen Teams
        </label>
        <input
          id="new-team-name"
          placeholder="Neues Team, z. B. Team Nord"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'new-team-error' : undefined}
          maxLength={80}
        />
        {error ? (
          <p id="new-team-error" className="field-error">
            {error}
          </p>
        ) : null}
      </div>
      <Button variant="primary" type="submit" disabled={saving}>
        Team hinzufügen
      </Button>
    </form>
  );
}

function RenameRow({
  team,
  onDone,
  onCancel,
}: {
  team: Team;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(team.name);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await api.patch<Team>(`/api/teams/${team.id}`, { name });
      onDone();
    } catch (err) {
      setError(errorText(err));
    }
  }

  return (
    <tr>
      <td colSpan={2}>
        <form className="inline-form" onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor={`rename-${team.id}`} className="visually-hidden">
              Neuer Name für {team.name}
            </label>
            <input
              id={`rename-${team.id}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && onCancel()}
              aria-invalid={error ? true : undefined}
              maxLength={80}
              autoFocus
            />
            {error ? <p className="field-error">{error}</p> : null}
          </div>
          <Button variant="ghost" onClick={onCancel}>
            Abbrechen
          </Button>
          <Button variant="primary" type="submit">
            Speichern
          </Button>
        </form>
      </td>
    </tr>
  );
}

export function TeamSection() {
  const [view, setView] = useState<View>('active');
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<number | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const load = useCallback(() => {
    api
      .get<Team[]>(`/api/teams?archived=${view === 'archived'}`)
      .then((list) => {
        setTeams(list);
        setLoadError(null);
      })
      .catch((err: unknown) =>
        setLoadError(err instanceof Error ? err.message : 'Fehler beim Laden.'),
      );
  }, [view]);

  useEffect(load, [load]);

  async function setArchived(team: Team, archived: boolean) {
    try {
      await api.patch<Team>(`/api/teams/${team.id}`, { archived });
      setNotice({
        text: archived ? `„${team.name}“ wurde archiviert.` : `„${team.name}“ ist wieder aktiv.`,
        undo: () => void setArchived(team, !archived),
      });
      load();
    } catch (err) {
      setNotice({ text: errorText(err) });
    }
  }

  return (
    <section className="section" aria-labelledby="teams-heading">
      <div className="section-header">
        <div className="section-title">
          <h2 id="teams-heading">Teams</h2>
          <SegmentedControl
            label="Teams filtern"
            value={view}
            onChange={(v) => {
              setView(v);
              setNotice(null);
              setRenaming(null);
            }}
            options={[
              { value: 'active', label: 'Aktiv' },
              { value: 'archived', label: 'Archiviert' },
            ]}
          />
        </div>
      </div>

      {view === 'active' ? <AddTeamForm onAdded={() => load()} /> : null}

      {notice ? (
        <div className="notice" role="status">
          <span>{notice.text}</span>
          {notice.undo ? (
            <Button
              variant="ghost"
              onClick={() => {
                const undo = notice.undo!;
                setNotice(null);
                undo();
              }}
            >
              Rückgängig
            </Button>
          ) : null}
        </div>
      ) : null}

      {loadError ? <p className="alert alert-error">{loadError}</p> : null}

      {teams && teams.length === 0 ? (
        <div className="empty-state">
          <p className="empty-title">
            {view === 'active' ? 'Noch keine Teams' : 'Keine archivierten Teams'}
          </p>
          {view === 'active' ? (
            <p>Teams werden später Anforderungen zugeordnet, z. B. „Team Nord“.</p>
          ) : null}
        </div>
      ) : null}

      {teams && teams.length > 0 ? (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Team</th>
                <th>
                  <span className="visually-hidden">Aktionen</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t) =>
                renaming === t.id ? (
                  <RenameRow
                    key={t.id}
                    team={t}
                    onDone={() => {
                      setRenaming(null);
                      load();
                    }}
                    onCancel={() => setRenaming(null)}
                  />
                ) : (
                  <tr key={t.id}>
                    <td className="team-name">{t.name}</td>
                    <td className="cell-actions">
                      {view === 'active' ? (
                        <>
                          <Button
                            variant="ghost"
                            onClick={() => setRenaming(t.id)}
                            aria-label={`${t.name} umbenennen`}
                          >
                            Umbenennen
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => void setArchived(t, true)}
                            aria-label={`${t.name} archivieren`}
                          >
                            Archivieren
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          onClick={() => void setArchived(t, false)}
                          aria-label={`${t.name} wiederherstellen`}
                        >
                          Wiederherstellen
                        </Button>
                      )}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
