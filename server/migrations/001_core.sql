-- Master data: projects and teams.
-- name_key holds the locale-lowercased name and enforces case-insensitive uniqueness
-- (SQLite's NOCASE only folds ASCII, not umlauts).

CREATE TABLE projects (
  id          INTEGER PRIMARY KEY,
  name        TEXT    NOT NULL,
  name_key    TEXT    NOT NULL UNIQUE,
  short_name  TEXT,
  color       TEXT    NOT NULL,
  description TEXT,
  archived    INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0, 1)),
  created_at  TEXT    NOT NULL,
  updated_at  TEXT    NOT NULL
);

CREATE TABLE teams (
  id         INTEGER PRIMARY KEY,
  name       TEXT    NOT NULL,
  name_key   TEXT    NOT NULL UNIQUE,
  archived   INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0, 1)),
  created_at TEXT    NOT NULL,
  updated_at TEXT    NOT NULL
);
