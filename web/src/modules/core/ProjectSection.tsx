import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { PROJECT_COLORS, type Project } from '../../../../shared/schemas/core';
import { formatDate } from '../../../../shared/date';
import { api, ApiError } from '../../shared/api';
import { Button, TextField } from '../../shared/ui';

interface FormState {
  name: string;
  shortName: string;
  color: string;
  description: string;
}

const EMPTY_FORM: FormState = { name: '', shortName: '', color: '', description: '' };

function ProjectForm({ onSaved, onCancel }: { onSaved: () => void; onCancel: () => void }) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = (key: keyof FormState) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      await api.post<Project>('/api/projects', { ...form, color: form.color || undefined });
      setForm(EMPTY_FORM);
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
      <h2>Neues Projekt</h2>
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
          <label className="swatch swatch-auto" title="Automatisch">
            <input
              type="radio"
              name="color"
              checked={form.color === ''}
              onChange={() => set('color')('')}
            />
            <span>Auto</span>
          </label>
          {PROJECT_COLORS.map((c) => (
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
          {saving ? 'Speichert …' : 'Projekt anlegen'}
        </Button>
      </div>
    </form>
  );
}

export function ProjectSection() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(() => {
    api
      .get<Project[]>('/api/projects')
      .then((list) => {
        setProjects(list);
        setLoadError(null);
      })
      .catch((err: unknown) =>
        setLoadError(err instanceof Error ? err.message : 'Fehler beim Laden.'),
      );
  }, []);

  useEffect(load, [load]);

  return (
    <section className="section" aria-labelledby="projects-heading">
      <div className="section-header">
        <h2 id="projects-heading">Projekte</h2>
        {!showForm ? (
          <Button variant="primary" onClick={() => setShowForm(true)}>
            Neues Projekt
          </Button>
        ) : null}
      </div>

      {showForm ? (
        <ProjectForm
          onSaved={() => {
            setShowForm(false);
            load();
          }}
          onCancel={() => setShowForm(false)}
        />
      ) : null}

      {loadError ? <p className="alert alert-error">{loadError}</p> : null}

      {projects && projects.length === 0 ? (
        <div className="empty-state">
          <p className="empty-title">Noch keine Projekte</p>
          <p>Lege dein erstes Projekt an, um Anforderungen und Risiken zuordnen zu können.</p>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
