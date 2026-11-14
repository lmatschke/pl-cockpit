import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { PROJECT_COLORS, type Project } from '../../../../shared/schemas/core';
import { formatDate } from '../../../../shared/date';
import { api, ApiError } from '../../shared/api';
import { Button, SegmentedControl, TextField } from '../../shared/ui';

interface FormState {
  name: string;
  shortName: string;
  color: string;
  description: string;
}

type View = 'active' | 'archived';

function toForm(project?: Project): FormState {
  return {
    name: project?.name ?? '',
    shortName: project?.shortName ?? '',
    color: project?.color ?? '',
    description: project?.description ?? '',
  };
}

function ProjectForm({
  project,
  onSaved,
  onCancel,
}: {
  project?: Project;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const isEdit = project !== undefined;
  const [form, setForm] = useState<FormState>(() => toForm(project));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = (key: keyof FormState) => (value: string) => setForm((f) => ({ ...f, [key]: value }));
  const colors =
    isEdit && !PROJECT_COLORS.includes(form.color as never)
      ? [...PROJECT_COLORS, form.color]
      : PROJECT_COLORS;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    const body = { ...form, color: form.color || undefined };
    try {
      if (isEdit) await api.patch<Project>(`/api/projects/${project.id}`, body);
      else await api.post<Project>('/api/projects', body);
      onSaved();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.status === 409 ? { name: err.message } : { ...err.fields, _: err.message });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card form-card" onSubmit={submit} noValidate>
      <h2>{isEdit ? 'Projekt bearbeiten' : 'Neues Projekt'}</h2>
      <div className="form-grid">
        <TextField
          label="Name"
          value={form.name}
          onChange={(e) => set('name')(e.target.value)}
          error={errors.name}
          autoFocus
          required
        />
        <TextField
          label="Kürzel"
          value={form.shortName}
          onChange={(e) => set('shortName')(e.target.value)}
          error={errors.shortName}
          hint="Optional, max. 12 Zeichen, z. B. CRM-R3"
          maxLength={12}
        />
      </div>
      <fieldset className="field color-field">
        <legend>Farbe</legend>
        <div className="swatches">
          {!isEdit ? (
            <label className="swatch swatch-auto" title="Automatisch">
              <input
                type="radio"
                name="color"
                checked={form.color === ''}
                onChange={() => set('color')('')}
              />
              <span>Auto</span>
            </label>
          ) : null}
          {colors.map((c) => (
            <label key={c} className="swatch" title={c}>
              <input
                type="radio"
                name="color"
                value={c}
                checked={form.color === c}
                onChange={() => set('color')(c)}
                aria-label={`Farbe ${c}`}
              />
              <span style={{ background: c }} />
            </label>
          ))}
        </div>
        {errors.color ? <p className="field-error">{errors.color}</p> : null}
      </fieldset>
      <div className="field">
        <label htmlFor="project-description">Beschreibung</label>
        <textarea
          id="project-description"
          value={form.description}
          onChange={(e) => set('description')(e.target.value)}
          rows={3}
        />
        {errors.description ? <p className="field-error">{errors.description}</p> : null}
      </div>
      <div className="form-actions">
        <Button variant="ghost" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button variant="primary" type="submit" disabled={saving}>
          {saving ? 'Speichert …' : isEdit ? 'Speichern' : 'Projekt anlegen'}
        </Button>
      </div>
    </form>
  );
}

interface Notice {
  text: string;
  undo?: () => void;
}

export function ProjectSection() {
  const [view, setView] = useState<View>('active');
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Project | 'new' | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const load = useCallback(() => {
    api
      .get<Project[]>(`/api/projects?archived=${view === 'archived'}`)
      .then((list) => {
        setProjects(list);
        setLoadError(null);
      })
      .catch((err: unknown) =>
        setLoadError(err instanceof Error ? err.message : 'Fehler beim Laden.'),
      );
  }, [view]);

  useEffect(load, [load]);

  async function setArchived(project: Project, archived: boolean) {
    try {
      await api.patch<Project>(`/api/projects/${project.id}`, { archived });
      setNotice({
        text: archived
          ? `„${project.name}“ wurde archiviert.`
          : `„${project.name}“ ist wieder aktiv.`,
        undo: () => void setArchived(project, !archived),
      });
      load();
    } catch (err) {
      setNotice({ text: err instanceof Error ? err.message : 'Aktion fehlgeschlagen.' });
    }
  }

  return (
    <section className="section" aria-labelledby="projects-heading">
      <div className="section-header">
        <div className="section-title">
          <h2 id="projects-heading">Projekte</h2>
          <SegmentedControl
            label="Projekte filtern"
            value={view}
            onChange={(v) => {
              setView(v);
              setNotice(null);
            }}
            options={[
              { value: 'active', label: 'Aktiv' },
              { value: 'archived', label: 'Archiviert' },
            ]}
          />
        </div>
        {editing === null ? (
          <Button variant="primary" onClick={() => setEditing('new')}>
            Neues Projekt
          </Button>
        ) : null}
      </div>

      {editing !== null ? (
        <ProjectForm
          key={editing === 'new' ? 'new' : editing.id}
          project={editing === 'new' ? undefined : editing}
          onSaved={() => {
            setEditing(null);
            load();
          }}
          onCancel={() => setEditing(null)}
        />
      ) : null}

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

      {projects && projects.length === 0 ? (
        <div className="empty-state">
          {view === 'active' ? (
            <>
              <p className="empty-title">Noch keine Projekte</p>
              <p>Lege dein erstes Projekt an, um Anforderungen und Risiken zuordnen zu können.</p>
            </>
          ) : (
            <p className="empty-title">Keine archivierten Projekte</p>
          )}
        </div>
      ) : null}

      {projects && projects.length > 0 ? (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Projekt</th>
                <th>Kürzel</th>
                <th>Beschreibung</th>
                <th>Angelegt</th>
                <th>
                  <span className="visually-hidden">Aktionen</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span className="project-name">
                      <span
                        className="color-dot"
                        style={{ background: p.color }}
                        aria-hidden="true"
                      />
                      {p.name}
                    </span>
                  </td>
                  <td>{p.shortName ? <span className="tag">{p.shortName}</span> : null}</td>
                  <td className="cell-muted cell-truncate">{p.description}</td>
                  <td className="cell-muted">{formatDate(p.createdAt)}</td>
                  <td className="cell-actions">
                    {view === 'active' ? (
                      <>
                        <Button
                          variant="ghost"
                          onClick={() => setEditing(p)}
                          aria-label={`${p.name} bearbeiten`}
                        >
                          Bearbeiten
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => void setArchived(p, true)}
                          aria-label={`${p.name} archivieren`}
                        >
                          Archivieren
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        onClick={() => void setArchived(p, false)}
                        aria-label={`${p.name} wiederherstellen`}
                      >
                        Wiederherstellen
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
